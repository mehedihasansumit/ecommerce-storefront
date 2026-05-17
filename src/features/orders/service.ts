import { OrderRepository } from "./repository";
import { ProductRepository } from "@/features/products/repository";
import { CouponService } from "@/features/coupons/service";
import { CampaignService } from "@/features/campaigns/service";
import { NotificationService } from "@/features/notifications/service";
import { StoreService } from "@/features/stores/service";
import type { IOrder, IOrderItem, RefundRequestStatus } from "./types";
import type { CreateOrderInput, CreateRefundRequestInput, ReviewRefundRequestInput } from "./schemas";
import { tAdmin } from "@/shared/lib/i18n";
import { normalizePhone } from "@/shared/lib/phone";
import {
  allocateBulkLineTotals,
  getBulkUnitPrice,
  normalizeTiers,
  round2,
} from "@/shared/lib/pricing";
import type { IProduct, IProductVariant } from "@/features/products/types";

function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ORD-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const OrderService = {
  async create(storeId: string, input: CreateOrderInput, userId?: string, clientIp?: string): Promise<IOrder> {
    // Validate products, resolve variants, then apply bulk pricing tiers
    // grouping by productId across all input lines (variants share the tier).
    type Resolved = {
      product: IProduct;
      activeVariant: IProductVariant | null;
      quantity: number;
      lineIndex: number;
    };
    const resolved: Resolved[] = [];
    const productCache = new Map<string, IProduct>();

    for (let i = 0; i < input.items.length; i++) {
      const lineItem = input.items[i];
      let product = productCache.get(lineItem.productId) ?? null;
      if (!product) {
        const fetched = await ProductRepository.findById(lineItem.productId);
        if (!fetched || fetched.storeId !== storeId) {
          throw new Error(`Product not found: ${lineItem.productId}`);
        }
        product = fetched;
        productCache.set(product._id, product);
      }

      const hasVariantSelections =
        lineItem.variantSelections && Object.keys(lineItem.variantSelections).length > 0;

      let activeVariant: IProductVariant | null = null;
      if (hasVariantSelections && product.variants?.length > 0) {
        activeVariant = product.variants.find((v) =>
          Object.entries(lineItem.variantSelections).every(
            ([k, val]) => v.optionValues?.[k] === val,
          ),
        ) ?? null;

        if (!activeVariant) {
          throw new Error(`Variant not found for: ${tAdmin(product.name)}`);
        }
        if (activeVariant.stock < lineItem.quantity) {
          throw new Error(`Insufficient stock for: ${tAdmin(product.name)}`);
        }
      } else if (product.stock < lineItem.quantity) {
        throw new Error(`Insufficient stock for: ${tAdmin(product.name)}`);
      }

      resolved.push({ product, activeVariant, quantity: lineItem.quantity, lineIndex: i });
    }

    // Group resolved lines by productId for tier qty aggregation.
    const linesByProduct = new Map<string, Resolved[]>();
    for (const r of resolved) {
      const list = linesByProduct.get(r.product._id) ?? [];
      list.push(r);
      linesByProduct.set(r.product._id, list);
    }

    // Compute per-line unit + total price. Tiers apply at product level; when present
    // they use product.price as base and override any variant price overrides so the
    // bundle total stays consistent across mixed-variant lines.
    const orderItems: IOrderItem[] = new Array(resolved.length);
    const productDetails: { productId: string; variantId?: string; quantity: number; price: number; categoryId?: string }[] = new Array(resolved.length);
    let subtotal = 0;

    for (const [, group] of linesByProduct) {
      const product = group[0].product;
      const tiers = normalizeTiers(product.pricingTiers);
      const qtys = group.map((g) => g.quantity);

      let lineTotals: number[];
      let unitPrices: number[];
      if (tiers.length > 0) {
        lineTotals = allocateBulkLineTotals(product.price, qtys, tiers);
        const effectiveUnit = getBulkUnitPrice(
          product.price,
          qtys.reduce((s, q) => s + q, 0),
          tiers,
        );
        unitPrices = qtys.map(() => round2(effectiveUnit));
      } else {
        unitPrices = group.map((g) => g.activeVariant?.price ?? product.price);
        lineTotals = group.map((g, i) => round2(unitPrices[i] * g.quantity));
      }

      group.forEach((g, i) => {
        const variantId = g.activeVariant?._id?.toString();
        const unitPrice = unitPrices[i];
        const totalPrice = lineTotals[i];

        orderItems[g.lineIndex] = {
          productId: product._id,
          variantId,
          productName: tAdmin(product.name),
          productSlug: product.slug,
          variantSelections: input.items[g.lineIndex].variantSelections,
          quantity: g.quantity,
          unitPrice,
          totalPrice,
        };
        productDetails[g.lineIndex] = {
          productId: product._id,
          variantId,
          quantity: g.quantity,
          price: unitPrice,
          categoryId: product.categoryId?.toString(),
        };
        subtotal += totalPrice;
      });
    }
    subtotal = round2(subtotal);

    // Validate and apply coupon if provided
    let discount = 0;
    let couponCode = "";
    let couponId: string | undefined;

    if (input.couponCode) {
      const validation = await CouponService.validate(
        storeId,
        input.couponCode,
        productDetails,
        userId
      );
      if (!validation.valid) {
        throw new Error(validation.reason || "Invalid coupon");
      }
      discount = validation.discount;
      couponCode = input.couponCode.toUpperCase();
      couponId = validation.couponId;
    }

    // Evaluate campaigns (server-authoritative). Reserve usage slots atomically
    // so concurrent orders can't exceed usageLimit.
    const campaignEval = await CampaignService.evaluateCart(
      storeId,
      userId,
      productDetails.map((d) => ({
        productId: d.productId,
        variantId: d.variantId,
        categoryId: d.categoryId,
        quantity: d.quantity,
        unitPrice: d.price,
      })),
    );

    const campaignIdsToReserve = campaignEval.appliedCampaigns.map((c) => c.campaignId);
    const { reserved, failed } = await CampaignService.reserveUsageSlots(campaignIdsToReserve);
    if (failed.length > 0) {
      await CampaignService.releaseUsageSlots(reserved);
      throw new Error("A campaign reached its usage limit. Please refresh and try again.");
    }
    const campaignDiscount = campaignEval.discountTotal;
    discount = round2(discount + campaignDiscount);

    const total = Math.max(0, subtotal - discount);
    const orderNumber = generateOrderNumber();

    let order: IOrder;
    try {
      order = await OrderRepository.create({
        storeId,
        orderNumber,
        userId: userId || null,
        guestPhone: input.shippingAddress.phone,
        guestEmail: input.guestEmail || undefined,
        items: orderItems,
        subtotal,
        shippingCost: 0,
        tax: 0,
        discount,
        couponCode,
        total,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        paymentStatus: "pending",
        paymentIntentId: "",
        status: "pending",
        notes: input.notes ?? "",
        clientIp: clientIp || "",
      });
    } catch (err) {
      await CampaignService.releaseUsageSlots(reserved);
      throw err;
    }

    // Decrement stock for each ordered item
    for (const detail of productDetails) {
      if (detail.variantId) {
        await ProductRepository.decreaseVariantStock(detail.productId, detail.variantId, detail.quantity);
      } else {
        await ProductRepository.decreaseStock(detail.productId, detail.quantity);
      }
    }

    // Record coupon usage after order is created
    if (couponId) {
      await CouponService.apply(couponId, userId || "", order._id, storeId);
    }

    // Record campaign redemptions (usage slot was reserved above)
    for (const applied of campaignEval.appliedCampaigns) {
      try {
        await CampaignService.recordRedemption(
          applied.campaignId,
          storeId,
          order._id,
          userId || null,
          applied.discountAmount,
          applied.rewardsApplied,
        );
      } catch {
        // Redemption record is observational; reservation already committed
      }
    }

    // Send order confirmation notification
    if (userId) {
      NotificationService.notify(storeId, userId, {
        type: "order_update",
        title: "Order Confirmed",
        message: `Your order ${orderNumber} has been placed successfully.`,
        channel: "all",
        metadata: { orderId: order._id, orderNumber, isNewOrder: true },
      }).catch(() => {}); // fire-and-forget
    }

    return order;
  },

  async getById(storeId: string, orderId: string): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;
    return order;
  },

  async getByOrderNumberAndPhone(
    storeId: string,
    orderNumber: string,
    phone: string
  ): Promise<IOrder | null> {
    const trimmedNumber = orderNumber.trim().toUpperCase();
    const trimmedPhone = phone.trim();
    if (!trimmedNumber || !trimmedPhone) return null;

    const order = await OrderRepository.findByOrderNumber(storeId, trimmedNumber);
    if (!order) return null;

    const normalized = normalizePhone(trimmedPhone);
    const withoutPlus = normalized.replace(/^\+/, "");
    const candidates = new Set([normalized, withoutPlus]);

    const stored = [order.guestPhone, order.shippingAddress?.phone].filter(
      (v): v is string => !!v
    );
    const matches = stored.some((p) => {
      const n = normalizePhone(p);
      return candidates.has(n) || candidates.has(n.replace(/^\+/, ""));
    });

    return matches ? order : null;
  },

  async getByStore(
    storeId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      paymentStatus?: string;
      search?: string;
    } = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    return OrderRepository.findByStore(storeId, options);
  },

  async getByUser(storeId: string, userId: string): Promise<IOrder[]> {
    return OrderRepository.findByUser(storeId, userId);
  },

  async getByIp(storeId: string, clientIp: string, excludeOrderId?: string): Promise<IOrder[]> {
    if (!clientIp) return [];
    return OrderRepository.findByIp(storeId, clientIp, excludeOrderId);
  },

  async getByPhone(storeId: string, phone: string): Promise<IOrder[]> {
    return OrderRepository.findByPhone(storeId, phone);
  },

  async getByPhonePaginated(
    storeId: string,
    phone: string,
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    const skip = (page - 1) * limit;
    return OrderRepository.findByPhonePaginated(storeId, phone, { skip, limit });
  },

  async getCustomerOrderStats(
    storeId: string
  ): Promise<{ userId: string; orderCount: number; totalSpent: number; lastOrderAt: string }[]> {
    return OrderRepository.getCustomerOrderStats(storeId);
  },

  async getPaymentStats(storeId: string): Promise<{
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
    totalRevenue: number;
  }> {
    return OrderRepository.getPaymentStats(storeId);
  },

  async updatePaymentStatus(
    storeId: string,
    orderId: string,
    paymentStatus: string
  ): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;
    return OrderRepository.updatePaymentStatus(orderId, paymentStatus);
  },

  async applyDiscount(
    storeId: string,
    orderId: string,
    discount: number
  ): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;
    if (discount < 0 || discount > order.subtotal + order.shippingCost + order.tax) {
      throw new Error("Invalid discount amount");
    }
    return OrderRepository.applyDiscount(orderId, discount);
  },

  async updateStatus(
    storeId: string,
    orderId: string,
    status: string,
    note?: string
  ): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;

    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (item.variantId) {
          await ProductRepository.increaseVariantStock(item.productId.toString(), item.variantId, item.quantity);
        } else {
          await ProductRepository.increaseStock(item.productId.toString(), item.quantity);
        }
      }
    }

    const updated = await OrderRepository.updateStatus(orderId, status, note);

    // Send status update notification
    if (updated && order.userId) {
      NotificationService.notify(storeId, order.userId, {
        type: "order_update",
        title: "Order Status Updated",
        message: `Your order ${order.orderNumber} is now ${status}.`,
        channel: "all",
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          status,
        },
      }).catch(() => {}); // fire-and-forget
    }

    return updated;
  },

  async requestRefund(
    storeId: string,
    orderId: string,
    input: CreateRefundRequestInput,
    userId?: string
  ): Promise<IOrder> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) throw new Error("Order not found");

    if (order.status !== "cancelled") {
      throw new Error("Refunds can only be requested for cancelled orders");
    }
    if (order.paymentStatus !== "paid") {
      throw new Error("Refunds can only be requested for paid orders");
    }

    const existingStatus = order.refundRequest?.status;
    if (existingStatus && existingStatus !== "rejected") {
      throw new Error("A refund request is already active for this order");
    }

    const store = await StoreService.getById(storeId);
    if (!store?.refundPolicy?.enabled) {
      throw new Error("Refund requests are not accepted for this store");
    }

    const cancelledEntry = [...(order.statusHistory ?? [])]
      .reverse()
      .find((e) => e.status === "cancelled");
    if (cancelledEntry) {
      const daysSince =
        (Date.now() - new Date(cancelledEntry.changedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSince > store.refundPolicy.windowDays) {
        throw new Error(
          `Refund window has expired (${store.refundPolicy.windowDays} days)`
        );
      }
    }

    const updated = await OrderRepository.createRefundRequest(orderId, {
      reason: input.reason,
      refundAmount: order.total,
      requestedAt: new Date(),
    });
    if (!updated) throw new Error("Failed to create refund request");

    if (userId) {
      NotificationService.notify(storeId, userId, {
        type: "order_update",
        title: "Refund Request Submitted",
        message: `Your refund request for order ${order.orderNumber} has been submitted.`,
        channel: "all",
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          refundStatus: "pending",
        },
      }).catch(() => {});
    }

    return updated;
  },

  async reviewRefund(
    storeId: string,
    orderId: string,
    adminId: string,
    input: ReviewRefundRequestInput
  ): Promise<IOrder> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) throw new Error("Order not found");

    const refund = order.refundRequest;
    if (!refund) throw new Error("No refund request found");

    if (input.action === "processed" && refund.status !== "approved") {
      throw new Error("Order must be approved before marking as processed");
    }
    if (
      (input.action === "approved" || input.action === "rejected") &&
      refund.status !== "pending"
    ) {
      throw new Error("Only pending refund requests can be approved or rejected");
    }

    let gatewayRefundId = "";
    if (input.action === "processed") {
      const result = await processGatewayRefund(order);
      gatewayRefundId = result.gatewayRefundId;
    }

    const resolvedAmount = input.refundAmount ?? refund.refundAmount;
    const updated = await OrderRepository.reviewRefundRequest(orderId, {
      status: input.action as RefundRequestStatus,
      adminNote: input.adminNote,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      refundAmount: resolvedAmount,
      processedAt: input.action === "processed" ? new Date() : undefined,
      gatewayRefundId,
    });
    if (!updated) throw new Error("Failed to update refund request");

    if (order.userId) {
      NotificationService.notify(storeId, order.userId, {
        type: "order_update",
        title: `Refund ${input.action}`,
        message: `Your refund request for order ${order.orderNumber} has been ${input.action}.`,
        channel: "all",
        metadata: {
          orderId,
          orderNumber: order.orderNumber,
          refundStatus: input.action,
          adminNote: input.adminNote,
          refundAmount: resolvedAmount,
        },
      }).catch(() => {});
    }

    return updated;
  },

  async getRefundQueue(
    storeId: string,
    options: { status?: RefundRequestStatus; page?: number; limit?: number } = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    return OrderRepository.findByStoreWithRefundRequests(storeId, options);
  },

  async cancelRefundRequest(
    storeId: string,
    orderId: string,
    userId: string
  ): Promise<IOrder> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) throw new Error("Order not found");
    if (order.userId !== userId) throw new Error("Unauthorized");
    if (order.refundRequest?.status !== "pending") {
      throw new Error("Only pending refund requests can be cancelled");
    }
    const updated = await OrderRepository.cancelRefundRequest(orderId);
    if (!updated) throw new Error("Failed to cancel refund request");
    return updated;
  },
};

async function processGatewayRefund(
  _order: IOrder
): Promise<{ success: boolean; gatewayRefundId: string }> {
  // TODO: switch on store.payment.provider → Stripe or SSLCommerz API
  return { success: true, gatewayRefundId: "" };
}

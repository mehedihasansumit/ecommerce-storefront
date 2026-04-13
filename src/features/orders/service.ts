import { OrderRepository } from "./repository";
import { ProductRepository } from "@/features/products/repository";
import { CouponService } from "@/features/coupons/service";
import { NotificationService } from "@/features/notifications/service";
import type { IOrder, IOrderItem } from "./types";
import type { CreateOrderInput } from "./schemas";
import { tAdmin } from "@/shared/lib/i18n";

function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "ORD-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const OrderService = {
  async create(storeId: string, input: CreateOrderInput, userId?: string): Promise<IOrder> {
    // Validate products and build order items using server-side prices
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    const productDetails: { productId: string; quantity: number; price: number; categoryId?: string }[] = [];

    for (const lineItem of input.items) {
      const product = await ProductRepository.findById(lineItem.productId);
      if (!product || product.storeId !== storeId) {
        throw new Error(`Product not found: ${lineItem.productId}`);
      }
      if (product.stock < lineItem.quantity) {
        throw new Error(`Insufficient stock for: ${tAdmin(product.name)}`);
      }

      const totalPrice = product.price * lineItem.quantity;
      orderItems.push({
        productId: product._id,
        productName: tAdmin(product.name),
        productSlug: product.slug,
        variantSelections: lineItem.variantSelections,
        quantity: lineItem.quantity,
        unitPrice: product.price,
        totalPrice,
      });
      subtotal += totalPrice;
      productDetails.push({
        productId: product._id,
        quantity: lineItem.quantity,
        price: product.price,
        categoryId: product.categoryId?.toString(),
      });
    }

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

    const total = Math.max(0, subtotal - discount);
    const orderNumber = generateOrderNumber();

    const order = await OrderRepository.create({
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
    });

    // Record coupon usage after order is created
    if (couponId) {
      await CouponService.apply(couponId, userId || "", order._id, storeId);
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
};

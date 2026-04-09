import { OrderRepository } from "./repository";
import { ProductRepository } from "@/features/products/repository";
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
  async create(storeId: string, input: CreateOrderInput): Promise<IOrder> {
    // Validate products and build order items using server-side prices
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

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
        variantSelections: lineItem.variantSelections,
        quantity: lineItem.quantity,
        unitPrice: product.price,
        totalPrice,
      });
      subtotal += totalPrice;
    }

    const total = subtotal; // shippingCost = 0, tax = 0
    const orderNumber = generateOrderNumber();

    const order = await OrderRepository.create({
      storeId,
      orderNumber,
      userId: null,
      guestPhone: input.shippingAddress.phone,
      guestEmail: input.guestEmail || undefined,
      items: orderItems,
      subtotal,
      shippingCost: 0,
      tax: 0,
      discount: 0,
      total,
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      paymentIntentId: "",
      status: "pending",
      notes: input.notes ?? "",
    });

    return order;
  },

  async getById(storeId: string, orderId: string): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;
    return order;
  },

  async getByStore(
    storeId: string,
    options: { status?: string } = {}
  ): Promise<IOrder[]> {
    return OrderRepository.findByStore(storeId, options);
  },

  async getByUser(storeId: string, userId: string): Promise<IOrder[]> {
    return OrderRepository.findByUser(storeId, userId);
  },

  async getByPhone(storeId: string, phone: string): Promise<IOrder[]> {
    return OrderRepository.findByPhone(storeId, phone);
  },

  async updateStatus(
    storeId: string,
    orderId: string,
    status: string,
    note?: string
  ): Promise<IOrder | null> {
    const order = await OrderRepository.findById(orderId);
    if (!order || order.storeId !== storeId) return null;
    return OrderRepository.updateStatus(orderId, status, note);
  },
};

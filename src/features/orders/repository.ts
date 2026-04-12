import dbConnect from "@/shared/lib/db";
import { OrderModel } from "./model";
import type { IOrder } from "./types";
import { normalizePhone } from "@/shared/lib/phone";

function serialize(doc: unknown): IOrder {
  return JSON.parse(JSON.stringify(doc));
}

export const OrderRepository = {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    await dbConnect();
    const now = new Date();
    const order = await OrderModel.create({
      ...data,
      statusHistory: [
        { status: data.status ?? "pending", changedAt: now, note: "" },
      ],
    } as any);
    return serialize(order.toObject());
  },

  async findById(id: string): Promise<IOrder | null> {
    await dbConnect();
    const order = await OrderModel.findById(id).lean();
    return order ? serialize(order) : null;
  },

  async findByOrderNumber(
    storeId: string,
    orderNumber: string
  ): Promise<IOrder | null> {
    await dbConnect();
    const order = await OrderModel.findOne({ storeId, orderNumber }).lean();
    return order ? serialize(order) : null;
  },

  async findByStore(
    storeId: string,
    {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
    }: {
      page?: number;
      limit?: number;
      status?: string;
      paymentStatus?: string;
      search?: string;
    } = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      const re = { $regex: search, $options: "i" };
      filter.$or = [
        { orderNumber: re },
        { "shippingAddress.name": re },
        { "shippingAddress.phone": re },
        { guestPhone: re },
        { guestEmail: re },
      ];
    }
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);
    return { orders: orders.map(serialize), total };
  },

  async findAll({
    page = 1,
    limit = 20,
    status,
    paymentStatus,
    storeId,
  }: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    storeId?: string;
  } = {}): Promise<{ orders: IOrder[]; total: number }> {
    await dbConnect();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (storeId) filter.storeId = storeId;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);
    return { orders: orders.map(serialize), total };
  },

  async findByUser(storeId: string, userId: string): Promise<IOrder[]> {
    await dbConnect();
    const orders = await OrderModel.find({ storeId, userId })
      .sort({ createdAt: -1 })
      .lean();
    return orders.map(serialize);
  },

  async findByPhone(storeId: string, phone: string): Promise<IOrder[]> {
    await dbConnect();
    const normalized = normalizePhone(phone);
    const withoutPlus = normalized.replace(/^\+/, "");
    const orders = await OrderModel.find({
      storeId,
      guestPhone: { $in: [normalized, withoutPlus] },
    })
      .sort({ createdAt: -1 })
      .lean();
    return orders.map(serialize);
  },

  async findByPhonePaginated(
    storeId: string,
    phone: string,
    { skip = 0, limit = 10 }: { skip?: number; limit?: number } = {}
  ): Promise<{ orders: IOrder[]; total: number }> {
    await dbConnect();
    const normalized = normalizePhone(phone);
    const withoutPlus = normalized.replace(/^\+/, "");
    const filter = { storeId, guestPhone: { $in: [normalized, withoutPlus] } };
    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);
    return { orders: orders.map(serialize), total };
  },

  async countByStore(storeId: string): Promise<number> {
    await dbConnect();
    return OrderModel.countDocuments({ storeId });
  },

  async getPaymentStats(storeId: string): Promise<{
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
    totalRevenue: number;
  }> {
    await dbConnect();
    const result = await OrderModel.aggregate([
      { $match: { storeId } },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          amount: { $sum: "$total" },
        },
      },
    ]);
    const stats = { paid: 0, pending: 0, failed: 0, refunded: 0, totalRevenue: 0 };
    for (const r of result) {
      const key = r._id as keyof typeof stats;
      if (key in stats && key !== "totalRevenue") {
        stats[key] = r.count as number;
      }
      if (r._id === "paid") stats.totalRevenue = r.amount as number;
    }
    return stats;
  },

  async getCustomerOrderStats(
    storeId: string
  ): Promise<{ userId: string; orderCount: number; totalSpent: number; lastOrderAt: string }[]> {
    await dbConnect();
    const result = await OrderModel.aggregate([
      { $match: { storeId, userId: { $ne: null } } },
      {
        $group: {
          _id: "$userId",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ]);
    return result.map((r) => ({
      userId: r._id.toString(),
      orderCount: r.orderCount,
      totalSpent: r.totalSpent,
      lastOrderAt: r.lastOrderAt?.toISOString() ?? "",
    }));
  },

  async updatePaymentStatus(
    id: string,
    paymentStatus: string
  ): Promise<IOrder | null> {
    await dbConnect();
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    ).lean();
    return order ? serialize(order) : null;
  },

  async applyDiscount(
    id: string,
    discount: number
  ): Promise<IOrder | null> {
    await dbConnect();
    // Recalculate total: subtotal + shippingCost + tax - discount
    const order = await OrderModel.findById(id).lean();
    if (!order) return null;
    const newTotal = Math.max(0, order.subtotal + order.shippingCost + order.tax - discount);
    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { discount, total: newTotal },
      { new: true }
    ).lean();
    return updated ? serialize(updated) : null;
  },

  async updateStatus(
    id: string,
    status: string,
    note = ""
  ): Promise<IOrder | null> {
    await dbConnect();
    const order = await OrderModel.findByIdAndUpdate(
      id,
      {
        status,
        $push: { statusHistory: { status, changedAt: new Date(), note } },
      },
      { new: true }
    ).lean();
    return order ? serialize(order) : null;
  },
};

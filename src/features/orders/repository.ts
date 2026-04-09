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
    const order = await OrderModel.create(data as any);
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
    { limit = 50, status }: { limit?: number; status?: string } = {}
  ): Promise<IOrder[]> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (status) filter.status = status;
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return orders.map(serialize);
  },

  async findAll({
    page = 1,
    limit = 20,
    status,
    storeId,
  }: {
    page?: number;
    limit?: number;
    status?: string;
    storeId?: string;
  } = {}): Promise<{ orders: IOrder[]; total: number }> {
    await dbConnect();
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
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

  async countByStore(storeId: string): Promise<number> {
    await dbConnect();
    return OrderModel.countDocuments({ storeId });
  },

  async updateStatus(
    id: string,
    status: string
  ): Promise<IOrder | null> {
    await dbConnect();
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();
    return order ? serialize(order) : null;
  },
};

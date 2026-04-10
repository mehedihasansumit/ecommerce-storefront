import dbConnect from "@/shared/lib/db";
import { CouponModel, CouponUsageModel } from "./model";
import type { ICoupon, ICouponUsage } from "./types";

function serialize(doc: unknown): ICoupon {
  return JSON.parse(JSON.stringify(doc));
}

export const CouponRepository = {
  async create(data: Partial<ICoupon>): Promise<ICoupon> {
    await dbConnect();
    const coupon = await CouponModel.create(data);
    return serialize(coupon.toObject());
  },

  async findById(id: string): Promise<ICoupon | null> {
    await dbConnect();
    const coupon = await CouponModel.findById(id).lean();
    return coupon ? serialize(coupon) : null;
  },

  async findByCode(storeId: string, code: string): Promise<ICoupon | null> {
    await dbConnect();
    const coupon = await CouponModel.findOne({
      storeId,
      code: code.toUpperCase(),
    }).lean();
    return coupon ? serialize(coupon) : null;
  },

  async findByStore(
    storeId: string,
    {
      page = 1,
      limit = 20,
      isActive,
    }: { page?: number; limit?: number; isActive?: boolean } = {}
  ): Promise<{ coupons: ICoupon[]; total: number }> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (isActive !== undefined) filter.isActive = isActive;
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      CouponModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CouponModel.countDocuments(filter),
    ]);
    return { coupons: coupons.map(serialize), total };
  },

  async update(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
    await dbConnect();
    const coupon = await CouponModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return coupon ? serialize(coupon) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await CouponModel.findByIdAndDelete(id);
    return !!result;
  },

  async incrementUsage(couponId: string): Promise<void> {
    await dbConnect();
    await CouponModel.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
  },

  async createUsage(data: {
    couponId: string;
    userId: string;
    orderId: string;
    storeId: string;
  }): Promise<void> {
    await dbConnect();
    await CouponUsageModel.create(data);
  },

  async countUserUsage(couponId: string, userId: string): Promise<number> {
    await dbConnect();
    return CouponUsageModel.countDocuments({ couponId, userId });
  },
};

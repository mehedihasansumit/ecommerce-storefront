import dbConnect from "@/shared/lib/db";
import { Types } from "mongoose";
import { PointTransactionModel } from "./model";
import type { IPointTransaction } from "./types";

export const PointRepository = {
  async create(data: Partial<IPointTransaction>): Promise<IPointTransaction> {
    await dbConnect();
    const doc = await PointTransactionModel.create(data);
    return JSON.parse(JSON.stringify(doc));
  },

  async findByUser(
    storeId: string,
    userId: string,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ transactions: IPointTransaction[]; total: number }> {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      PointTransactionModel.find({ storeId, userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PointTransactionModel.countDocuments({ storeId, userId }),
    ]);
    return {
      transactions: JSON.parse(JSON.stringify(transactions)),
      total,
    };
  },

  async findByStore(
    storeId: string,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ transactions: IPointTransaction[]; total: number }> {
    await dbConnect();
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      PointTransactionModel.find({ storeId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PointTransactionModel.countDocuments({ storeId }),
    ]);
    return {
      transactions: JSON.parse(JSON.stringify(transactions)),
      total,
    };
  },

  async getStoreStats(storeId: string): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    transactionCount: number;
  }> {
    await dbConnect();
    const result = await PointTransactionModel.aggregate<{
      _id: null;
      earned: number;
      redeemed: number;
      count: number;
    }>([
      { $match: { storeId: new Types.ObjectId(storeId) } },
      {
        $group: {
          _id: null,
          earned: {
            $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] },
          },
          redeemed: {
            $sum: { $cond: [{ $lt: ["$amount", 0] }, { $abs: "$amount" }, 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const row = result[0];
    return {
      totalEarned: row?.earned ?? 0,
      totalRedeemed: row?.redeemed ?? 0,
      transactionCount: row?.count ?? 0,
    };
  },

  async existsForReview(reviewId: string): Promise<boolean> {
    await dbConnect();
    const doc = await PointTransactionModel.findOne({ reviewId }).lean();
    return doc !== null;
  },
};

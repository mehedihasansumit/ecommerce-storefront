import dbConnect from "@/shared/lib/db";
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

  async existsForReview(reviewId: string): Promise<boolean> {
    await dbConnect();
    const doc = await PointTransactionModel.findOne({ reviewId }).lean();
    return doc !== null;
  },
};

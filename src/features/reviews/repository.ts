import { Types } from "mongoose";
import dbConnect from "@/shared/lib/db";
import { ReviewModel } from "./model";
import type { IReview } from "./types";

function serialize(doc: unknown): IReview {
  return JSON.parse(JSON.stringify(doc));
}

export const ReviewRepository = {
  async create(data: Partial<IReview>): Promise<IReview> {
    await dbConnect();
    const doc = await ReviewModel.create(data);
    return serialize(doc.toObject());
  },

  async findApprovedByProduct(
    storeId: string,
    productId: string,
    { page, limit }: { page: number; limit: number }
  ): Promise<{ reviews: IReview[]; total: number }> {
    await dbConnect();
    const skip = (page - 1) * limit;
    const filter = { storeId, productId, isApproved: true };
    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReviewModel.countDocuments(filter),
    ]);
    return { reviews: reviews.map(serialize), total };
  },

  async findByUserAndProduct(
    storeId: string,
    userId: string,
    productId: string
  ): Promise<IReview | null> {
    await dbConnect();
    const doc = await ReviewModel.findOne({ storeId, userId, productId }).lean();
    return doc ? serialize(doc) : null;
  },

  async findByStore(
    storeId: string,
    {
      page,
      limit,
      isApproved,
    }: { page: number; limit: number; isApproved?: boolean }
  ): Promise<{ reviews: IReview[]; total: number }> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (isApproved !== undefined) filter.isApproved = isApproved;
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ReviewModel.countDocuments(filter),
    ]);
    return { reviews: reviews.map(serialize), total };
  },

  async findById(id: string): Promise<IReview | null> {
    await dbConnect();
    const doc = await ReviewModel.findById(id).lean();
    return doc ? serialize(doc) : null;
  },

  async setApproved(id: string, isApproved: boolean): Promise<IReview | null> {
    await dbConnect();
    const doc = await ReviewModel.findByIdAndUpdate(
      id,
      { isApproved },
      { new: true }
    ).lean();
    return doc ? serialize(doc) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await ReviewModel.findByIdAndDelete(id);
    return !!result;
  },

  async getProductRatingStats(
    storeId: string,
    productId: string
  ): Promise<{ averageRating: number; reviewCount: number }> {
    await dbConnect();
    const results = await ReviewModel.aggregate([
      {
        $match: {
          storeId: new Types.ObjectId(storeId),
          productId: new Types.ObjectId(productId),
          isApproved: true,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    if (!results.length) return { averageRating: 0, reviewCount: 0 };
    return {
      averageRating: Math.round((results[0].averageRating as number) * 10) / 10,
      reviewCount: results[0].reviewCount as number,
    };
  },
};

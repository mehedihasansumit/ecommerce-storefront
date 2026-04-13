import { Types } from "mongoose";

export type PointReason = "review_approved" | "redemption";

export interface IPointTransaction {
  _id: string;
  storeId: string;
  userId: string;
  amount: number;
  reason: PointReason;
  reviewId: string | null;
  couponId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPointTransactionDocument
  extends Omit<IPointTransaction, "_id" | "storeId" | "userId" | "reviewId" | "couponId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  userId: Types.ObjectId;
  reviewId: Types.ObjectId | null;
  couponId: Types.ObjectId | null;
}

export const POINTS_PER_REVIEW = 10;
export const MIN_REDEMPTION_POINTS = 100;
export const POINTS_PER_BDT = 10; // 100 pts = ৳10

export type PointReason = "review_approved" | "redemption";

export interface IPointTransaction {
  _id: string;
  storeId: string;
  userId: string;
  amount: number;
  reason: PointReason;
  reviewId: string | null;
  couponId: string | null;
  createdAt: string;
}

export const POINTS_PER_REVIEW = 10;
export const MIN_REDEMPTION_POINTS = 100;
export const POINTS_PER_BDT = 10;

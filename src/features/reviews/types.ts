import { Types } from "mongoose";

export interface IReview {
  _id: string;
  storeId: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewDocument extends Omit<IReview, "_id" | "storeId" | "productId" | "userId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  productId: Types.ObjectId;
  userId: Types.ObjectId;
}

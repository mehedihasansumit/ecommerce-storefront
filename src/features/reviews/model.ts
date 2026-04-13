import mongoose, { Schema, Model } from "mongoose";
import { IReviewDocument } from "./types";

const ReviewSchema = new Schema<IReviewDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, default: "" },
    reviewerName: { type: String, default: "" },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, isApproved: 1 });
ReviewSchema.index(
  { storeId: 1, userId: 1, productId: 1 },
  { unique: true }
);

export const ReviewModel: Model<IReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<IReviewDocument>("Review", ReviewSchema);

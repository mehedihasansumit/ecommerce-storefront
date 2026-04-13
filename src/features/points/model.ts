import mongoose, { Schema, Model } from "mongoose";
import type { IPointTransactionDocument } from "./types";

const PointTransactionSchema = new Schema<IPointTransactionDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["review_approved", "redemption"],
      required: true,
    },
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: "Review",
      default: null,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true }
);

PointTransactionSchema.index({ storeId: 1, userId: 1, createdAt: -1 });
PointTransactionSchema.index({ reviewId: 1 }, { unique: true, sparse: true });

export const PointTransactionModel: Model<IPointTransactionDocument> =
  mongoose.models.PointTransaction ||
  mongoose.model<IPointTransactionDocument>("PointTransaction", PointTransactionSchema);

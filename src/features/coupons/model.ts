import mongoose, { Schema, Model } from "mongoose";
import type { ICouponDocument } from "./types";

const CouponSchema = new Schema<ICouponDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    perCustomerLimit: { type: Number, default: 1 },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    requiresLogin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CouponSchema.index({ storeId: 1, code: 1 }, { unique: true });

export const CouponModel: Model<ICouponDocument> =
  mongoose.models.Coupon ||
  mongoose.model<ICouponDocument>("Coupon", CouponSchema);

// CouponUsage schema for tracking per-customer usage
const CouponUsageSchema = new Schema({
  couponId: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  usedAt: { type: Date, default: Date.now },
});

CouponUsageSchema.index({ couponId: 1, userId: 1 });
CouponUsageSchema.index({ storeId: 1 });

export const CouponUsageModel =
  mongoose.models.CouponUsage ||
  mongoose.model("CouponUsage", CouponUsageSchema);

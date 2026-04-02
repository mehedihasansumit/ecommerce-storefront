import mongoose, { Schema, Model } from "mongoose";
import { ICartDocument } from "./types";

const CartSchema = new Schema<ICartDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String, default: null },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        variantSelections: { type: Map, of: String },
        quantity: { type: Number, required: true, min: 1 },
        priceAtAdd: { type: Number, required: true },
      },
    ],
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CartSchema.index({ storeId: 1, userId: 1 });
CartSchema.index({ storeId: 1, sessionId: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CartModel: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>("Cart", CartSchema);

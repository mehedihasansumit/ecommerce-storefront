import mongoose, { Schema, Model } from "mongoose";
import { IOrderDocument } from "./types";

const OrderSchema = new Schema<IOrderDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    guestPhone: { type: String, default: null },
    guestEmail: { type: String, default: null },

    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        productName: String,
        productSlug: { type: String, default: "" },
        variantSelections: { type: Map, of: String },
        quantity: Number,
        unitPrice: Number,
        totalPrice: Number,
      },
    ],

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true },

    shippingAddress: {
      name: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },

    paymentMethod: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentIntentId: { type: String, default: "" },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, required: true },
        note: { type: String, default: "" },
      },
    ],

    notes: { type: String, default: "" },
    clientIp: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderSchema.index({ storeId: 1, userId: 1, createdAt: -1 });
OrderSchema.index({ storeId: 1, guestPhone: 1, createdAt: -1 });
OrderSchema.index({ storeId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ storeId: 1, status: 1 });
OrderSchema.index({ storeId: 1, clientIp: 1, createdAt: -1 });

export const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

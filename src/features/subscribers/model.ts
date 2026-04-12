import mongoose, { Schema, Model } from "mongoose";
import type { ISubscriberDocument } from "./types";

const SubscriberSchema = new Schema<ISubscriberDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
    },
  },
  { timestamps: true }
);

// Unique email per store (only where email exists)
SubscriberSchema.index(
  { storeId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

// Unique phone per store (only where phone exists)
SubscriberSchema.index(
  { storeId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
);

export const SubscriberModel: Model<ISubscriberDocument> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriberDocument>("Subscriber", SubscriberSchema);

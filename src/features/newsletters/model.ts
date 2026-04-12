import mongoose, { Schema, Model } from "mongoose";
import type { INewsletterDocument } from "./types";

const NewsletterSchema = new Schema<INewsletterDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
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

NewsletterSchema.index({ storeId: 1, email: 1 }, { unique: true });

export const NewsletterModel: Model<INewsletterDocument> =
  mongoose.models.Newsletter ||
  mongoose.model<INewsletterDocument>("Newsletter", NewsletterSchema);

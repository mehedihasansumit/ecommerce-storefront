import mongoose, { Schema, Model } from "mongoose";
import type { IActivityEventDocument } from "./types";

const ActivityEventSchema = new Schema<IActivityEventDocument>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    eventType: {
      type: String,
      enum: ["product_view", "search", "add_to_cart"],
      required: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: "" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    searchQuery: { type: String, default: "" },
    sessionId: { type: String, default: "" },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// TTL — auto-expire events after 90 days
ActivityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

// Query indexes for aggregation pipelines
ActivityEventSchema.index({ storeId: 1, eventType: 1, createdAt: -1 });
ActivityEventSchema.index({ storeId: 1, productId: 1, eventType: 1 });
ActivityEventSchema.index({ storeId: 1, categoryId: 1, eventType: 1 });

export const ActivityEventModel: Model<IActivityEventDocument> =
  (mongoose.models.ActivityEvent as Model<IActivityEventDocument>) ||
  mongoose.model<IActivityEventDocument>("ActivityEvent", ActivityEventSchema);

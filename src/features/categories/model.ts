import mongoose, { Schema, Model } from "mongoose";
import { ICategoryDocument } from "./types";

const CategorySchema = new Schema<ICategoryDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ storeId: 1, parentId: 1 });

export const CategoryModel: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

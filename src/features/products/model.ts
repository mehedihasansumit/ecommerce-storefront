import mongoose, { Schema, Model } from "mongoose";
import { IProductDocument } from "./types";

const ProductOptionSchema = new Schema(
  { name: String, values: [String] },
  { _id: false }
);

const ProductVariantSchema = new Schema({
  optionValues: { type: Schema.Types.Mixed, default: {} },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  sku: { type: String, default: "" },
  images: [{ url: String, alt: String }],
});

const ProductSchema = new Schema<IProductDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    name: { type: Schema.Types.Mixed, required: true },
    slug: { type: String, required: true },
    description: { type: Schema.Types.Mixed, default: {} },
    shortDescription: { type: Schema.Types.Mixed, default: {} },

    price: { type: Number, required: true },
    compareAtPrice: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },

    sku: { type: String, default: "" },
    barcode: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    trackInventory: { type: Boolean, default: true },

    images: [{ url: String, alt: String }],
    thumbnail: { type: String, default: "" },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    tags: [String],

    options: [ProductOptionSchema],
    variants: [ProductVariantSchema],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    seo: {
      title: { type: Schema.Types.Mixed, default: {} },
      description: { type: Schema.Types.Mixed, default: {} },
    },

    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, categoryId: 1 });
ProductSchema.index({ storeId: 1, isFeatured: 1 });
ProductSchema.index({ storeId: 1, isActive: 1, createdAt: -1 });
ProductSchema.index({ storeId: 1, "variants.sku": 1 });

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

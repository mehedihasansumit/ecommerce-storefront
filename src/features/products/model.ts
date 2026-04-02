import mongoose, { Schema, Model } from "mongoose";
import { IProductDocument } from "./types";

const ProductSchema = new Schema<IProductDocument>(
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
    shortDescription: { type: String, default: "" },

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

    variants: [
      {
        name: String,
        options: [
          {
            value: String,
            priceModifier: { type: Number, default: 0 },
            stock: { type: Number, default: 0 },
            sku: String,
          },
        ],
      },
    ],

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
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

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

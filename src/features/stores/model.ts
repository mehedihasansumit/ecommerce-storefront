import mongoose, { Schema, Model } from "mongoose";
import { IStoreDocument } from "./types";

const StoreSchema = new Schema<IStoreDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    domains: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true },

    logo: { type: String, default: "" },
    favicon: { type: String, default: "" },

    theme: {
      primaryColor: { type: String, default: "#3B82F6" },
      secondaryColor: { type: String, default: "#10B981" },
      accentColor: { type: String, default: "#F59E0B" },
      backgroundColor: { type: String, default: "#FFFFFF" },
      textColor: { type: String, default: "#111827" },
      headerBg: { type: String, default: "#111827" },
      headerText: { type: String, default: "#FFFFFF" },
      fontFamily: { type: String, default: "Inter" },
      borderRadius: { type: String, default: "0.5rem" },
      layoutStyle: {
        type: String,
        enum: ["grid", "list", "masonry"],
        default: "grid",
      },
    },

    heroBanners: [
      {
        image: String,
        title: String,
        subtitle: String,
        linkUrl: String,
        linkText: String,
      },
    ],

    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: [String],
      ogImage: { type: String, default: "" },
    },

    payment: {
      provider: {
        type: String,
        enum: ["stripe", "sslcommerz"],
        default: "stripe",
      },
      stripePublicKey: { type: String, default: "" },
      stripeSecretKey: { type: String, default: "" },
      sslcommerzStoreId: { type: String, default: "" },
      sslcommerzStorePassword: { type: String, default: "" },
      currency: { type: String, default: "USD" },
    },

    contact: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },

    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

StoreSchema.index({ domains: 1 });
StoreSchema.index({ slug: 1 });

export const StoreModel: Model<IStoreDocument> =
  mongoose.models.Store || mongoose.model<IStoreDocument>("Store", StoreSchema);

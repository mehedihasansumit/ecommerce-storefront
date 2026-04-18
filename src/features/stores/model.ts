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
      dark: {
        backgroundColor: { type: String, default: "#111827" },
        textColor:       { type: String, default: "#F9FAFB" },
        surfaceColor:    { type: String, default: "#1F2937" },
        borderColor:     { type: String, default: "#374151" },
        headerBg:        { type: String, default: "#0F172A" },
        headerText:      { type: String, default: "#F8FAFC" },
      },
    },

    heroBanners: [
      {
        image: String,
        title: { type: Schema.Types.Mixed, default: {} },
        subtitle: { type: Schema.Types.Mixed, default: {} },
        linkUrl: String,
        linkText: String,
      },
    ],

    seo: {
      title: { type: Schema.Types.Mixed, default: {} },
      description: { type: Schema.Types.Mixed, default: {} },
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

    socialOrdering: {
      whatsapp: {
        enabled: { type: Boolean, default: false },
        phoneNumber: { type: String, default: "" },
        messageTemplate: {
          type: String,
          default: "Hi, I'd like to order {{productName}} ({{productUrl}})",
        },
      },
      facebook: {
        enabled: { type: Boolean, default: false },
        pageUrl: { type: String, default: "" },
      },
    },

    pointsConfig: {
      enabled: { type: Boolean, default: true },
      pointsPerReview: { type: Number, default: 10 },
      minRedemptionPoints: { type: Number, default: 100 },
      pointsPerBdt: { type: Number, default: 10 },
    },

    supportedLanguages: {
      type: [String],
      default: ["en"],
    },
    defaultLanguage: { type: String, default: "en" },
  },
  { timestamps: true }
);

StoreSchema.index({ domains: 1 });
StoreSchema.index({ slug: 1 });

export const StoreModel: Model<IStoreDocument> =
  mongoose.models.Store || mongoose.model<IStoreDocument>("Store", StoreSchema);

import mongoose, { Schema, Model } from "mongoose";
import type { INotificationDocument, IAnnouncementDocument } from "./types";

const NotificationSchema = new Schema<INotificationDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ["order_update", "promotion", "account"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: ["in_app", "email", "sms", "all"],
      default: "in_app",
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ storeId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ storeId: 1, userId: 1, isRead: 1 });

export const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);

// Announcements = store-wide banners/alerts shown on the storefront
const AnnouncementSchema = new Schema<IAnnouncementDocument>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    displayType: {
      type: String,
      enum: ["banner", "modal", "bar", "float"],
      default: "bar",
    },
    backgroundColor: { type: String, default: "#1e40af" },
    textColor: { type: String, default: "#ffffff" },
    linkUrl: { type: String, default: "" },
    linkText: { type: String, default: "" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    dismissible: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
    },
    broadcastSentAt: { type: Date, default: null },
    broadcastCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

AnnouncementSchema.index({ storeId: 1, isActive: 1, startDate: 1 });

export const AnnouncementModel: Model<IAnnouncementDocument> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncementDocument>("Announcement", AnnouncementSchema);

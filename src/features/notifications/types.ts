export type NotificationType = "order_update" | "promotion" | "account";
export type NotificationChannel = "in_app" | "email" | "sms" | "all";

export interface INotification {
  _id: string;
  storeId: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface INotificationDocument {
  _id: import("mongoose").Types.ObjectId;
  storeId: import("mongoose").Types.ObjectId;
  userId: import("mongoose").Types.ObjectId | null;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

// Announcements = store-wide banners/alerts displayed on the storefront
export type AnnouncementDisplayType = "banner" | "modal" | "bar" | "float";
export type AnnouncementStatus = "active" | "inactive" | "scheduled";

export interface IAnnouncement {
  _id: string;
  storeId: string;
  title: string;
  message: string;
  displayType: AnnouncementDisplayType;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  linkText: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  dismissible: boolean;
  priority: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncementDocument {
  _id: import("mongoose").Types.ObjectId;
  storeId: import("mongoose").Types.ObjectId;
  title: string;
  message: string;
  displayType: AnnouncementDisplayType;
  backgroundColor: string;
  textColor: string;
  linkUrl: string;
  linkText: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  dismissible: boolean;
  priority: number;
  createdBy: import("mongoose").Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

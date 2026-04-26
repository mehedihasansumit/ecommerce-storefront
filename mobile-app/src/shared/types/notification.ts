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
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type AnnouncementDisplayType = "banner" | "modal" | "bar" | "float";

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
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  dismissible: boolean;
  priority: number;
  createdAt: string;
}

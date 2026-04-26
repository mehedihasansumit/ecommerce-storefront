import { apiClient } from "./client";
import type { INotification, IAnnouncement } from "@/shared/types/notification";

export async function getNotifications(): Promise<INotification[]> {
  const { data } = await apiClient.get<{ notifications: INotification[] }>("/api/notifications");
  return data.notifications ?? (data as unknown as INotification[]);
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/api/notifications/unread-count");
  return data.count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.put(`/api/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.put("/api/notifications/read-all");
}

export async function getActiveAnnouncements(): Promise<IAnnouncement[]> {
  const { data } = await apiClient.get<IAnnouncement[]>("/api/announcements/active");
  return Array.isArray(data) ? data : [];
}

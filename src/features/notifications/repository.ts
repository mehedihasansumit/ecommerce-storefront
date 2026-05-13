import { and, count, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  notifications,
  announcements,
  type Notification,
  type Announcement,
} from "@/db/schema/notifications";
import type {
  IAnnouncement,
  INotification,
  NotificationChannel,
  NotificationType,
  AnnouncementDisplayType,
} from "./types";

function toINotification(row: Notification): INotification {
  return {
    _id: row.id,
    storeId: row.storeId,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    channel: row.channel as NotificationChannel,
    isRead: row.isRead,
    readAt: row.readAt,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.createdAt,
  };
}

function toIAnnouncement(row: Announcement): IAnnouncement {
  return {
    _id: row.id,
    storeId: row.storeId,
    title: row.title,
    message: row.message,
    displayType: (row.displayType ?? "banner") as AnnouncementDisplayType,
    backgroundColor: row.backgroundColor ?? "",
    textColor: row.textColor ?? "",
    linkUrl: row.linkUrl ?? "",
    linkText: row.linkText ?? "",
    startDate: row.startDate ?? new Date(0),
    endDate: row.endDate,
    isActive: row.isActive,
    dismissible: row.dismissible,
    priority: row.priority,
    createdBy: row.createdBy,
    broadcastSentAt: row.broadcastSentAt,
    broadcastCount: row.broadcastCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toNotificationInsert(data: Partial<INotification>): typeof notifications.$inferInsert {
  const { _id, createdAt, ...rest } = data;
  void _id;
  void createdAt;
  return rest as typeof notifications.$inferInsert;
}

function toAnnouncementInsert(data: Partial<IAnnouncement>): typeof announcements.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof announcements.$inferInsert;
}

export const NotificationRepository = {
  async create(data: Partial<INotification>): Promise<INotification> {
    const [row] = await db.insert(notifications).values(toNotificationInsert(data)).returning();
    return toINotification(row);
  },

  async createMany(items: Partial<INotification>[]): Promise<void> {
    if (!items.length) return;
    await db.insert(notifications).values(items.map(toNotificationInsert));
  },

  async findByUser(
    storeId: string,
    userId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
  ): Promise<{ notifications: INotification[]; total: number }> {
    const where = and(eq(notifications.storeId, storeId), eq(notifications.userId, userId));
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(notifications).where(where),
    ]);
    return { notifications: rows.map(toINotification), total: Number(total) };
  },

  async countUnread(storeId: string, userId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.storeId, storeId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
    return Number(total);
  },

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    const [row] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return row ? toINotification(row) : null;
  },

  async markAllRead(storeId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.storeId, storeId),
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
        ),
      );
  },
};

export const AnnouncementRepository = {
  async create(data: Partial<IAnnouncement>): Promise<IAnnouncement> {
    const [row] = await db.insert(announcements).values(toAnnouncementInsert(data)).returning();
    return toIAnnouncement(row);
  },

  async findById(id: string): Promise<IAnnouncement | null> {
    const [row] = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return row ? toIAnnouncement(row) : null;
  },

  async findByStore(
    storeId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {},
  ): Promise<{ announcements: IAnnouncement[]; total: number }> {
    const where = eq(announcements.storeId, storeId);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(announcements)
        .where(where)
        .orderBy(desc(announcements.priority), desc(announcements.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(announcements).where(where),
    ]);
    return { announcements: rows.map(toIAnnouncement), total: Number(total) };
  },

  async findActive(storeId: string): Promise<IAnnouncement[]> {
    const now = new Date();
    const rows = await db
      .select()
      .from(announcements)
      .where(
        and(
          eq(announcements.storeId, storeId),
          eq(announcements.isActive, true),
          lte(announcements.startDate, now),
          or(isNull(announcements.endDate), gte(announcements.endDate, now)),
        ),
      )
      .orderBy(desc(announcements.priority), desc(announcements.createdAt))
      .limit(5);
    return rows.map(toIAnnouncement);
  },

  async update(id: string, data: Partial<IAnnouncement>): Promise<IAnnouncement | null> {
    const insert = toAnnouncementInsert(data);
    const [row] = await db
      .update(announcements)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return row ? toIAnnouncement(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(announcements)
      .where(eq(announcements.id, id))
      .returning({ id: announcements.id });
    return result.length > 0;
  },
};

void sql;

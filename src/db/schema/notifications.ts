import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { users, adminUsers } from "./auth";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    channel: text("channel").notNull().default("in_app"),
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeUserCreatedIdx: index("idx_notifications_store_user_created").on(
      t.storeId,
      t.userId,
      t.createdAt,
    ),
    storeUserUnreadIdx: index("idx_notifications_store_user_unread")
      .on(t.storeId, t.userId, t.isRead)
      .where(sql`${t.isRead} = false`),
    typeCk: check(
      "ck_notifications_type",
      sql`${t.type} IN ('order_update','promotion','account')`,
    ),
    channelCk: check(
      "ck_notifications_channel",
      sql`${t.channel} IN ('in_app','email','sms','all')`,
    ),
  }),
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    displayType: text("display_type"),
    backgroundColor: text("background_color"),
    textColor: text("text_color"),
    linkUrl: text("link_url"),
    linkText: text("link_text"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    dismissible: boolean("dismissible").notNull().default(true),
    priority: integer("priority").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "restrict" }),
    broadcastSentAt: timestamp("broadcast_sent_at", { withTimezone: true }),
    broadcastCount: integer("broadcast_count").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    storeActiveStartIdx: index("idx_announcements_store_active_start").on(
      t.storeId,
      t.isActive,
      t.startDate,
    ),
    displayTypeCk: check(
      "ck_announcements_display_type",
      sql`${t.displayType} IS NULL OR ${t.displayType} IN ('banner','modal','bar','float')`,
    ),
  }),
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").notNull().defaultRandom(),
    storeId: uuid("store_id").notNull(),
    eventType: text("event_type").notNull(),
    productId: uuid("product_id"),
    categoryId: uuid("category_id"),
    userId: uuid("user_id"),
    productName: text("product_name"),
    searchQuery: text("search_query"),
    sessionId: text("session_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    storeEventCreatedIdx: index("idx_events_store_event_created").on(
      t.storeId,
      t.eventType,
      t.createdAt,
    ),
    storeProductEventIdx: index("idx_events_store_product_event").on(
      t.storeId,
      t.productId,
      t.eventType,
    ),
    storeCategoryEventIdx: index("idx_events_store_category_event").on(
      t.storeId,
      t.categoryId,
      t.eventType,
    ),
    eventTypeCk: check(
      "ck_events_type",
      sql`${t.eventType} IN ('product_view','search','add_to_cart')`,
    ),
  }),
);

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type NewActivityEvent = typeof activityEvents.$inferInsert;

import { sql } from "drizzle-orm";
import { check, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";

export const subscribers = pgTable(
  "subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    email: text("email"),
    phone: text("phone"),
    status: text("status").notNull().default("subscribed"),
    ...timestamps,
  },
  (t) => ({
    storeEmailUq: uniqueIndex("uq_subscribers_store_email")
      .on(t.storeId, t.email)
      .where(sql`${t.email} IS NOT NULL`),
    storePhoneUq: uniqueIndex("uq_subscribers_store_phone")
      .on(t.storeId, t.phone)
      .where(sql`${t.phone} IS NOT NULL`),
    statusCk: check("ck_subscribers_status", sql`${t.status} IN ('subscribed','unsubscribed')`),
  }),
);

export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

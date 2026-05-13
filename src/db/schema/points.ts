import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { users } from "./auth";
import { reviews } from "./reviews";
import { coupons } from "./coupons";

export const pointTransactions = pgTable(
  "point_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    reviewId: uuid("review_id").references(() => reviews.id, { onDelete: "set null" }),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => ({
    storeUserCreatedIdx: index("idx_points_store_user_created").on(
      t.storeId,
      t.userId,
      t.createdAt,
    ),
    reviewUq: uniqueIndex("uq_points_review")
      .on(t.reviewId)
      .where(sql`${t.reviewId} IS NOT NULL`),
    reasonCk: check(
      "ck_points_reason",
      sql`${t.reason} IN ('review_approved','redemption')`,
    ),
  }),
);

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;

import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { users } from "./auth";
import { orders } from "./orders";

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    value: numeric("value", { precision: 12, scale: 2 }).notNull(),
    minOrderAmount: numeric("min_order_amount", { precision: 12, scale: 2 }),
    maxDiscountAmount: numeric("max_discount_amount", { precision: 12, scale: 2 }),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").notNull().default(0),
    perCustomerLimit: integer("per_customer_limit"),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
    applicableProducts: uuid("applicable_products").array().notNull().default(sql`'{}'::uuid[]`),
    applicableCategories: uuid("applicable_categories").array().notNull().default(sql`'{}'::uuid[]`),
    requiresLogin: boolean("requires_login").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    storeCodeUq: uniqueIndex("uq_coupons_store_code").on(t.storeId, t.code),
    storeActiveValidIdx: index("idx_coupons_store_active_valid").on(
      t.storeId,
      t.isActive,
      t.validUntil,
    ),
    typeCk: check("ck_coupons_type", sql`${t.type} IN ('percentage','fixed')`),
    codeUpperCk: check("ck_coupons_code_upper", sql`${t.code} = upper(${t.code})`),
  }),
);

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    couponUserIdx: index("idx_coupon_usages_coupon_user").on(t.couponId, t.userId),
    storeIdx: index("idx_coupon_usages_store").on(t.storeId),
  }),
);

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;

import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
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
import { adminUsers } from "./auth";
import { products, productVariants } from "./products";

const ORDER_STATUS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
const PAYMENT_STATUS = ["pending", "paid", "failed", "refunded"] as const;

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderNumber: text("order_number").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestPhone: text("guest_phone"),
    guestEmail: text("guest_email"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    shippingCost: numeric("shipping_cost", { precision: 12, scale: 2 }).notNull().default("0"),
    tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
    discount: numeric("discount", { precision: 12, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    couponCode: text("coupon_code"),
    paymentMethod: text("payment_method").notNull(),
    paymentIntentId: text("payment_intent_id"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    status: text("status").notNull().default("pending"),
    shippingAddress: jsonb("shipping_address").notNull(),
    notes: text("notes"),
    clientIp: text("client_ip"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    storeOrderNumberUq: uniqueIndex("uq_orders_store_number").on(t.storeId, t.orderNumber),
    storeUserCreatedIdx: index("idx_orders_store_user_created").on(t.storeId, t.userId, t.createdAt),
    storeGuestPhoneIdx: index("idx_orders_store_guest_phone")
      .on(t.storeId, t.guestPhone, t.createdAt)
      .where(sql`${t.guestPhone} IS NOT NULL`),
    storeStatusIdx: index("idx_orders_store_status").on(t.storeId, t.status),
    storeIpIdx: index("idx_orders_store_ip").on(t.storeId, t.clientIp, t.createdAt),
    statusCk: check(
      "ck_orders_status",
      sql`${t.status} IN ('pending','confirmed','processing','shipped','delivered','cancelled')`,
    ),
    paymentStatusCk: check(
      "ck_orders_payment_status",
      sql`${t.paymentStatus} IN ('pending','paid','failed','refunded')`,
    ),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "restrict",
    }),
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    variantSelections: jsonb("variant_selections"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => ({
    orderIdx: index("idx_order_items_order").on(t.orderId),
    productIdx: index("idx_order_items_product").on(t.productId),
    qtyCk: check("ck_order_items_qty", sql`${t.quantity} > 0`),
  }),
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    note: text("note"),
    changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    orderChangedIdx: index("idx_order_history_order_changed").on(t.orderId, t.changedAt),
  }),
);

export const orderRefunds = pgTable(
  "order_refunds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    reason: text("reason"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    adminNote: text("admin_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }),
    gatewayRefundId: text("gateway_refund_id"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    statusIdx: index("idx_refunds_status").on(t.status),
    reviewedByIdx: index("idx_refunds_reviewed_by").on(t.reviewedBy),
  }),
);

export { ORDER_STATUS, PAYMENT_STATUS };
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type NewOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
export type OrderRefund = typeof orderRefunds.$inferSelect;
export type NewOrderRefund = typeof orderRefunds.$inferInsert;

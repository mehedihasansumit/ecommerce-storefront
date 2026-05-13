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
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { users } from "./auth";
import { products } from "./products";

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    sessionId: text("session_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    storeUserIdx: index("idx_carts_store_user").on(t.storeId, t.userId),
    storeSessionIdx: index("idx_carts_store_session").on(t.storeId, t.sessionId),
    expiresIdx: index("idx_carts_expires")
      .on(t.expiresAt)
      .where(sql`${t.expiresAt} IS NOT NULL`),
  }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantSelections: jsonb("variant_selections"),
    quantity: integer("quantity").notNull(),
    priceAtAdd: numeric("price_at_add", { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => ({
    cartIdx: index("idx_cart_items_cart").on(t.cartId),
    qtyCk: check("ck_cart_items_qty", sql`${t.quantity} > 0`),
  }),
);

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;

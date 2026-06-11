import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { products } from "./products";
import { users } from "./auth";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment"),
    images: text("images").array().notNull().default(sql`'{}'::text[]`),
    reviewerName: text("reviewer_name"),
    isApproved: boolean("is_approved").notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    storeUserProductUq: uniqueIndex("uq_reviews_store_user_product").on(
      t.storeId,
      t.userId,
      t.productId,
    ),
    productApprovedIdx: index("idx_reviews_product_approved").on(t.productId, t.isApproved),
    ratingCk: check("ck_reviews_rating", sql`${t.rating} BETWEEN 1 AND 5`),
  }),
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

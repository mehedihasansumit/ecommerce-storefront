import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedString } from "@/shared/types/i18n";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    shortDescription: jsonb("short_description").$type<LocalizedString>(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
    costPrice: numeric("cost_price", { precision: 12, scale: 2 }),
    stock: integer("stock").notNull().default(0),
    trackInventory: boolean("track_inventory").notNull().default(true),
    sku: text("sku"),
    barcode: text("barcode"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    thumbnail: text("thumbnail"),
    options: jsonb("options").notNull().default([]),
    pricingTiers: jsonb("pricing_tiers")
      .$type<Array<{ quantity: number; totalPrice: number }>>()
      .notNull()
      .default([]),
    isActive: boolean("is_active").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    seo: jsonb("seo").notNull().default({}),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 }).notNull().default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    storeSlugUq: uniqueIndex("uq_products_store_slug").on(t.storeId, t.slug),
    storeCategoryIdx: index("idx_products_store_category")
      .on(t.storeId, t.categoryId)
      .where(sql`${t.isActive} = true`),
    storeFeaturedIdx: index("idx_products_store_featured")
      .on(t.storeId, t.isFeatured)
      .where(sql`${t.isFeatured} = true`),
    storeCreatedIdx: index("idx_products_store_created")
      .on(t.storeId, t.createdAt)
      .where(sql`${t.isActive} = true`),
    tagsGin: index("idx_products_tags").using("gin", t.tags),
    stockCheck: check("ck_products_stock_nonneg", sql`${t.stock} >= 0`),
  }),
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    optionValues: jsonb("option_values").notNull().default({}),
    price: numeric("price", { precision: 12, scale: 2 }),
    compareAtPrice: numeric("compare_at_price", { precision: 12, scale: 2 }),
    stock: integer("stock").notNull().default(0),
    sku: text("sku"),
    ...timestamps,
  },
  (t) => ({
    productIdx: index("idx_variants_product").on(t.productId),
    productSkuUq: uniqueIndex("uq_variants_product_sku")
      .on(t.productId, t.sku)
      .where(sql`${t.sku} IS NOT NULL`),
    stockCheck: check("ck_variants_stock_nonneg", sql`${t.stock} >= 0`),
  }),
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "cascade",
    }),
    url: text("url").notNull(),
    alt: text("alt"),
    key: text("key"),
    width: integer("width"),
    height: integer("height"),
    variants: jsonb("variants"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => ({
    productIdx: index("idx_images_product").on(t.productId),
    variantIdx: index("idx_images_variant").on(t.variantId),
  }),
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

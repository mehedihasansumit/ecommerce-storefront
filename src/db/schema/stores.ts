import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    domains: text("domains").array().notNull().default(sql`'{}'::text[]`),
    isActive: boolean("is_active").notNull().default(true),
    logo: text("logo"),
    logoDark: text("logo_dark"),
    favicon: text("favicon"),
    faviconDark: text("favicon_dark"),
    theme: jsonb("theme").notNull().default({}),
    heroLayout: text("hero_layout"),
    heroContained: boolean("hero_contained").notNull().default(false),
    heroBorderRadius: text("hero_border_radius"),
    heroBanners: jsonb("hero_banners").notNull().default([]),
    seo: jsonb("seo").notNull().default({}),
    payment: jsonb("payment").notNull().default({}),
    contact: jsonb("contact").notNull().default({}),
    socialLinks: jsonb("social_links").notNull().default({}),
    socialOrdering: jsonb("social_ordering").notNull().default({}),
    pointsConfig: jsonb("points_config").notNull().default({}),
    refundPolicy: jsonb("refund_policy").notNull().default({}),
    supportedLanguages: text("supported_languages")
      .array()
      .notNull()
      .default(sql`ARRAY['en']::text[]`),
    defaultLanguage: text("default_language").notNull().default("en"),
    ...timestamps,
  },
  (t) => ({
    domainsGin: index("idx_stores_domains").using("gin", t.domains),
    activeIdx: index("idx_stores_active").on(t.isActive),
  }),
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;

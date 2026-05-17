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
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedString } from "@/shared/types/i18n";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { users } from "./auth";
import { orders } from "./orders";

const CAMPAIGN_TYPE = ["bogo", "bundle", "tiered", "freeGift"] as const;
const CAMPAIGN_STATUS = ["draft", "active", "paused", "expired"] as const;
const CAMPAIGN_AUDIENCE = ["all", "firstOrder", "loggedInOnly"] as const;

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: jsonb("name").$type<LocalizedString>().notNull(),
    description: jsonb("description").$type<LocalizedString>(),
    type: text("type").notNull(),
    status: text("status").notNull().default("draft"),
    priority: integer("priority").notNull().default(0),
    stackable: boolean("stackable").notNull().default(false),
    repeatable: boolean("repeatable").notNull().default(false),
    audience: text("audience").notNull().default("all"),
    minCartTotal: numeric("min_cart_total", { precision: 12, scale: 2 }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    usageLimit: integer("usage_limit"),
    perUserLimit: integer("per_user_limit"),
    usageCount: integer("usage_count").notNull().default(0),
    conditions: jsonb("conditions").notNull().default([]),
    rewards: jsonb("rewards").notNull().default([]),
    excludedProductIds: uuid("excluded_product_ids").array().notNull().default(sql`'{}'::uuid[]`),
    bannerImage: text("banner_image"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => ({
    storeSlugUq: uniqueIndex("uq_campaigns_store_slug").on(t.storeId, t.slug),
    storeStatusValidIdx: index("idx_campaigns_store_status_valid").on(
      t.storeId,
      t.status,
      t.endDate,
    ),
    storePriorityIdx: index("idx_campaigns_store_priority").on(t.storeId, t.priority),
    typeCk: check(
      "ck_campaigns_type",
      sql`${t.type} IN ('bogo','bundle','tiered','freeGift')`,
    ),
    statusCk: check(
      "ck_campaigns_status",
      sql`${t.status} IN ('draft','active','paused','expired')`,
    ),
    audienceCk: check(
      "ck_campaigns_audience",
      sql`${t.audience} IN ('all','firstOrder','loggedInOnly')`,
    ),
    dateCk: check("ck_campaigns_date_range", sql`${t.endDate} > ${t.startDate}`),
  }),
);

export const campaignRedemptions = pgTable(
  "campaign_redemptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    rewardsApplied: jsonb("rewards_applied").notNull().default([]),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    campaignUserIdx: index("idx_campaign_redemptions_campaign_user").on(
      t.campaignId,
      t.userId,
    ),
    storeIdx: index("idx_campaign_redemptions_store").on(t.storeId),
    orderIdx: index("idx_campaign_redemptions_order").on(t.orderId),
  }),
);

export { CAMPAIGN_TYPE, CAMPAIGN_STATUS, CAMPAIGN_AUDIENCE };
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignRedemption = typeof campaignRedemptions.$inferSelect;
export type NewCampaignRedemption = typeof campaignRedemptions.$inferInsert;

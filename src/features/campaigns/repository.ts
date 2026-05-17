import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  campaigns,
  campaignRedemptions,
  type Campaign,
  type CampaignRedemption,
  type NewCampaignRedemption,
} from "@/db/schema/campaigns";
import type {
  CampaignStatus,
  CampaignType,
  CampaignAudience,
  ICampaign,
  ICampaignRedemption,
  ICondition,
  IReward,
} from "./types";

function toICampaign(row: Campaign): ICampaign {
  return {
    _id: row.id,
    storeId: row.storeId,
    slug: row.slug,
    name: row.name,
    description: row.description ?? null,
    type: row.type as CampaignType,
    status: row.status as CampaignStatus,
    priority: row.priority,
    stackable: row.stackable,
    repeatable: row.repeatable,
    audience: row.audience as CampaignAudience,
    minCartTotal: row.minCartTotal === null ? null : Number(row.minCartTotal),
    startDate: row.startDate,
    endDate: row.endDate,
    usageLimit: row.usageLimit,
    perUserLimit: row.perUserLimit,
    usageCount: row.usageCount,
    conditions: (row.conditions as ICondition[]) ?? [],
    rewards: (row.rewards as IReward[]) ?? [],
    excludedProductIds: row.excludedProductIds ?? [],
    bannerImage: row.bannerImage ?? null,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toIRedemption(row: CampaignRedemption): ICampaignRedemption {
  return {
    _id: row.id,
    campaignId: row.campaignId,
    storeId: row.storeId,
    userId: row.userId ?? null,
    orderId: row.orderId,
    rewardsApplied: (row.rewardsApplied as IReward[]) ?? [],
    discountAmount: Number(row.discountAmount),
    redeemedAt: row.redeemedAt,
  };
}

function toInsert(data: Partial<ICampaign>): typeof campaigns.$inferInsert {
  const { _id, createdAt, updatedAt, minCartTotal, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  const out: Record<string, unknown> = { ...rest };
  if (minCartTotal !== undefined && minCartTotal !== null) {
    out.minCartTotal = String(minCartTotal);
  } else if (minCartTotal === null) {
    out.minCartTotal = null;
  }
  return out as typeof campaigns.$inferInsert;
}

export const CampaignRepository = {
  async create(data: Partial<ICampaign>): Promise<ICampaign> {
    const [row] = await db.insert(campaigns).values(toInsert(data)).returning();
    return toICampaign(row);
  },

  async findById(id: string): Promise<ICampaign | null> {
    const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    return row ? toICampaign(row) : null;
  },

  async findBySlug(storeId: string, slug: string): Promise<ICampaign | null> {
    const [row] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.storeId, storeId), eq(campaigns.slug, slug)))
      .limit(1);
    return row ? toICampaign(row) : null;
  },

  async findByStore(
    storeId: string,
    {
      page = 1,
      limit = 20,
      status,
    }: { page?: number; limit?: number; status?: CampaignStatus } = {},
  ): Promise<{ campaigns: ICampaign[]; total: number }> {
    const conds = [eq(campaigns.storeId, storeId)];
    if (status) conds.push(eq(campaigns.status, status));
    const where = and(...conds);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(where)
        .orderBy(desc(campaigns.priority), desc(campaigns.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(campaigns).where(where),
    ]);
    return { campaigns: rows.map(toICampaign), total: Number(total) };
  },

  async findActiveByStore(storeId: string, now: Date = new Date()): Promise<ICampaign[]> {
    const rows = await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.storeId, storeId),
          eq(campaigns.status, "active"),
          eq(campaigns.isActive, true),
          lte(campaigns.startDate, now),
          gte(campaigns.endDate, now),
        ),
      )
      .orderBy(desc(campaigns.priority), asc(campaigns.createdAt));
    return rows.map(toICampaign);
  },

  async update(id: string, data: Partial<ICampaign>): Promise<ICampaign | null> {
    const insert = toInsert(data);
    const [row] = await db
      .update(campaigns)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return row ? toICampaign(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(eq(campaigns.id, id))
      .returning({ id: campaigns.id });
    return result.length > 0;
  },

  /**
   * Atomic increment + cap check. Returns true if reserved successfully.
   * Prevents over-redemption under concurrent order placement.
   */
  async tryReserveUsage(id: string): Promise<boolean> {
    const result = await db
      .update(campaigns)
      .set({ usageCount: sql`${campaigns.usageCount} + 1`, updatedAt: new Date() })
      .where(
        and(
          eq(campaigns.id, id),
          sql`(${campaigns.usageLimit} IS NULL OR ${campaigns.usageCount} < ${campaigns.usageLimit})`,
        ),
      )
      .returning({ id: campaigns.id });
    return result.length > 0;
  },

  async releaseUsage(id: string): Promise<void> {
    await db
      .update(campaigns)
      .set({ usageCount: sql`GREATEST(${campaigns.usageCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(campaigns.id, id));
  },

  async countUserRedemptions(campaignId: string, userId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(campaignRedemptions)
      .where(
        and(
          eq(campaignRedemptions.campaignId, campaignId),
          eq(campaignRedemptions.userId, userId),
        ),
      );
    return Number(total);
  },

  async createRedemption(
    data: Omit<NewCampaignRedemption, "id" | "redeemedAt" | "discountAmount"> & {
      discountAmount: number;
    },
  ): Promise<ICampaignRedemption> {
    const [row] = await db
      .insert(campaignRedemptions)
      .values({
        ...data,
        discountAmount: String(data.discountAmount),
      })
      .returning();
    return toIRedemption(row);
  },

  async findRedemptionsByOrder(orderId: string): Promise<ICampaignRedemption[]> {
    const rows = await db
      .select()
      .from(campaignRedemptions)
      .where(eq(campaignRedemptions.orderId, orderId));
    return rows.map(toIRedemption);
  },
};

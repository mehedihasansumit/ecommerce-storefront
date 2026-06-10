import { CampaignRepository } from "./repository";
import { evaluateCart as engineEvaluate } from "./engine";
import { ProductRepository } from "@/features/products/repository";
import { OrderRepository } from "@/features/orders/repository";
import { deleteUnreferencedBlobs } from "@/shared/lib/storage";
import type {
  AppliedFreeItem,
  CampaignEvaluationResult,
  EvaluationCartItem,
  EvaluationContext,
  ICampaign,
} from "./types";
import type { CreateCampaignInput, UpdateCampaignInput } from "./schemas";
import { tAdmin } from "@/shared/lib/i18n";

export const CampaignService = {
  async create(storeId: string, input: CreateCampaignInput): Promise<ICampaign> {
    if (input.endDate <= input.startDate) {
      throw new Error("endDate must be after startDate");
    }
    const existing = await CampaignRepository.findBySlug(storeId, input.slug);
    if (existing) throw new Error("Campaign slug already exists for this store");
    return CampaignRepository.create({ ...input, storeId });
  },

  async update(
    storeId: string,
    campaignId: string,
    input: UpdateCampaignInput,
  ): Promise<ICampaign | null> {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign || campaign.storeId !== storeId) return null;
    if (input.slug && input.slug !== campaign.slug) {
      const dupe = await CampaignRepository.findBySlug(storeId, input.slug);
      if (dupe) throw new Error("Campaign slug already exists for this store");
    }
    const updated = await CampaignRepository.update(campaignId, input);
    if (updated) {
      await deleteUnreferencedBlobs(
        [campaign.bannerImage ?? ""],
        [updated.bannerImage ?? ""],
      ).catch(() => {});
    }
    return updated;
  },

  async delete(storeId: string, campaignId: string): Promise<boolean> {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign || campaign.storeId !== storeId) return false;
    const ok = await CampaignRepository.delete(campaignId);
    if (ok && campaign.bannerImage) {
      await deleteUnreferencedBlobs([campaign.bannerImage]).catch(() => {});
    }
    return ok;
  },

  async getById(storeId: string, campaignId: string): Promise<ICampaign | null> {
    const campaign = await CampaignRepository.findById(campaignId);
    if (!campaign || campaign.storeId !== storeId) return null;
    return campaign;
  },

  async listByStore(
    storeId: string,
    options?: Parameters<typeof CampaignRepository.findByStore>[1],
  ) {
    return CampaignRepository.findByStore(storeId, options);
  },

  /**
   * Evaluate cart against active campaigns. Used by:
   * - Storefront cart/checkout for live preview (recomputed client-trigger, server-authoritative)
   * - Order placement for final discount + redemption tracking
   */
  async evaluateCart(
    storeId: string,
    userId: string | undefined,
    items: EvaluationCartItem[],
    options: { shippingCost?: number } = {},
  ): Promise<CampaignEvaluationResult> {
    const active = await CampaignRepository.findActiveByStore(storeId);
    if (active.length === 0) {
      return {
        appliedCampaigns: [],
        freeItems: [],
        discountTotal: 0,
        freeShipping: false,
        suggestions: [],
      };
    }

    // First-order check: only fire DB query if any campaign needs it
    let isFirstOrder = false;
    if (userId && active.some((c) => c.audience === "firstOrder")) {
      const userOrders = await OrderRepository.findByUser(storeId, userId);
      isFirstOrder = userOrders.length === 0;
    }

    // Filter perUserLimit campaigns
    const eligibleByUserLimit: ICampaign[] = [];
    for (const c of active) {
      if (userId && c.perUserLimit !== null) {
        const used = await CampaignRepository.countUserRedemptions(c._id, userId);
        if (used >= c.perUserLimit) continue;
      }
      eligibleByUserLimit.push(c);
    }

    const cartSubtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const ctx: EvaluationContext = {
      storeId,
      userId,
      isFirstOrder,
      cartItems: items,
      cartSubtotal,
      shippingCost: options.shippingCost ?? 0,
    };

    // Resolve free-product / cheapest-in-category lookups via product repo
    const productIdsNeeded = new Set<string>();
    const categoryIdsNeeded = new Set<string>();
    for (const c of eligibleByUserLimit) {
      for (const r of c.rewards) {
        if (r.type === "freeProduct") productIdsNeeded.add(r.productId);
        if (r.type === "freeFromCategory") categoryIdsNeeded.add(r.categoryId);
      }
    }

    const productCache = new Map<string, { productId: string; price: number; name: string; categoryId?: string }>();
    await Promise.all(
      Array.from(productIdsNeeded).map(async (pid) => {
        const p = await ProductRepository.findById(pid);
        if (p && p.storeId === storeId && p.isActive) {
          productCache.set(pid, {
            productId: p._id,
            price: p.price,
            name: tAdmin(p.name),
            categoryId: p.categoryId || undefined,
          });
        }
      }),
    );

    return engineEvaluate(eligibleByUserLimit, ctx, {
      resolveFreeProduct: (productId) => productCache.get(productId) ?? null,
      resolveCheapestInCategory: (categoryId, cart) => {
        const inCart = cart.filter((i) => i.categoryId === categoryId);
        if (inCart.length === 0) return null;
        const cheapest = inCart.reduce((min, cur) =>
          cur.unitPrice < min.unitPrice ? cur : min,
        );
        return {
          productId: cheapest.productId,
          price: cheapest.unitPrice,
          name: "",
          categoryId,
        };
      },
    });
  },

  /**
   * Atomically reserve usage slots for all to-be-applied campaigns. Returns the
   * list that successfully reserved. Caller must call releaseUsage on failure.
   */
  async reserveUsageSlots(
    campaignIds: string[],
  ): Promise<{ reserved: string[]; failed: string[] }> {
    const reserved: string[] = [];
    const failed: string[] = [];
    for (const id of campaignIds) {
      const ok = await CampaignRepository.tryReserveUsage(id);
      if (ok) reserved.push(id);
      else failed.push(id);
    }
    return { reserved, failed };
  },

  async releaseUsageSlots(campaignIds: string[]): Promise<void> {
    await Promise.all(campaignIds.map((id) => CampaignRepository.releaseUsage(id)));
  },

  async recordRedemption(
    campaignId: string,
    storeId: string,
    orderId: string,
    userId: string | null,
    discountAmount: number,
    rewardsApplied: AppliedFreeItem[] | unknown[],
  ) {
    return CampaignRepository.createRedemption({
      campaignId,
      storeId,
      orderId,
      userId,
      discountAmount,
      rewardsApplied: rewardsApplied as never,
    });
  },
};

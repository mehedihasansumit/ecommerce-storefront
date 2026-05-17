import { round2 } from "@/shared/lib/pricing";
import type {
  AppliedCampaign,
  AppliedFreeItem,
  CampaignEvaluationResult,
  EvaluationCartItem,
  EvaluationContext,
  ICampaign,
  ICondition,
  IReward,
  NearMissSuggestion,
} from "./types";

interface FreeProductCatalogEntry {
  productId: string;
  categoryId?: string;
  price: number;
  name: string;
}

interface EngineDeps {
  resolveFreeProduct?: (productId: string) => FreeProductCatalogEntry | null;
  resolveCheapestInCategory?: (
    categoryId: string,
    cart: EvaluationCartItem[],
  ) => FreeProductCatalogEntry | null;
}

function filteredCart(cart: EvaluationCartItem[], excluded: string[]): EvaluationCartItem[] {
  if (excluded.length === 0) return cart;
  const set = new Set(excluded);
  return cart.filter((i) => !set.has(i.productId));
}

function matchCondition(cond: ICondition, ctx: EvaluationContext): boolean {
  switch (cond.type) {
    case "categoryQty": {
      const qty = ctx.cartItems
        .filter((i) => i.categoryId === cond.categoryId)
        .reduce((s, i) => s + i.quantity, 0);
      return qty >= cond.minQty;
    }
    case "productQty": {
      const qty = ctx.cartItems
        .filter((i) => i.productId === cond.productId)
        .reduce((s, i) => s + i.quantity, 0);
      return qty >= cond.minQty;
    }
    case "specificProducts": {
      const set = new Set(cond.productIds);
      const qty = ctx.cartItems
        .filter((i) => set.has(i.productId))
        .reduce((s, i) => s + i.quantity, 0);
      return qty >= cond.minQty;
    }
    case "cartTotal":
      return ctx.cartSubtotal >= cond.minAmount;
  }
}

function nearMiss(cond: ICondition, ctx: EvaluationContext): NearMissSuggestion["remaining"] | null {
  switch (cond.type) {
    case "categoryQty": {
      const qty = ctx.cartItems
        .filter((i) => i.categoryId === cond.categoryId)
        .reduce((s, i) => s + i.quantity, 0);
      const diff = cond.minQty - qty;
      return diff > 0 && diff <= 2 ? diff : null;
    }
    case "productQty": {
      const qty = ctx.cartItems
        .filter((i) => i.productId === cond.productId)
        .reduce((s, i) => s + i.quantity, 0);
      const diff = cond.minQty - qty;
      return diff > 0 && diff <= 2 ? diff : null;
    }
    case "specificProducts": {
      const set = new Set(cond.productIds);
      const qty = ctx.cartItems
        .filter((i) => set.has(i.productId))
        .reduce((s, i) => s + i.quantity, 0);
      const diff = cond.minQty - qty;
      return diff > 0 && diff <= 2 ? diff : null;
    }
    case "cartTotal": {
      const diff = cond.minAmount - ctx.cartSubtotal;
      return diff > 0 && diff <= cond.minAmount * 0.25 ? diff : null;
    }
  }
}

function isAudienceMatch(c: ICampaign, ctx: EvaluationContext): boolean {
  if (c.audience === "loggedInOnly") return !!ctx.userId;
  if (c.audience === "firstOrder") return !!ctx.userId && ctx.isFirstOrder === true;
  return true;
}

function isWithinWindow(c: ICampaign, now: Date): boolean {
  return now >= new Date(c.startDate) && now <= new Date(c.endDate);
}

function isUsageAvailable(c: ICampaign): boolean {
  if (c.usageLimit === null) return true;
  return c.usageCount < c.usageLimit;
}

function computeRewards(
  rewards: IReward[],
  ctx: EvaluationContext,
  deps: EngineDeps,
): { discount: number; freeItems: AppliedFreeItem[]; freeShipping: boolean } {
  let discount = 0;
  const freeItems: AppliedFreeItem[] = [];
  let freeShipping = false;

  for (const reward of rewards) {
    switch (reward.type) {
      case "fixedDiscount":
        discount += reward.amount;
        break;

      case "percentDiscount": {
        let base = 0;
        if (reward.appliesTo === "cart") base = ctx.cartSubtotal;
        else if (reward.appliesTo === "category" && reward.targetId) {
          base = ctx.cartItems
            .filter((i) => i.categoryId === reward.targetId)
            .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        } else if (reward.appliesTo === "product" && reward.targetId) {
          base = ctx.cartItems
            .filter((i) => i.productId === reward.targetId)
            .reduce((s, i) => s + i.unitPrice * i.quantity, 0);
        }
        let value = (base * reward.percent) / 100;
        if (reward.maxDiscount !== undefined) value = Math.min(value, reward.maxDiscount);
        discount += value;
        break;
      }

      case "freeProduct": {
        const entry = deps.resolveFreeProduct?.(reward.productId);
        if (entry) {
          const inCartLines = ctx.cartItems.filter((i) => i.productId === entry.productId);
          const inCartQty = inCartLines.reduce((s, i) => s + i.quantity, 0);
          const effectiveQty = Math.min(reward.qty, inCartQty);
          if (effectiveQty > 0) {
            const cheapest = inCartLines.reduce(
              (min, cur) => (cur.unitPrice < min.unitPrice ? cur : min),
              inCartLines[0],
            );
            const unitPrice = cheapest.unitPrice;
            discount += unitPrice * effectiveQty;
            freeItems.push({
              productId: entry.productId,
              qty: effectiveQty,
              unitPrice,
              source: "freeProduct",
            });
          }
        }
        break;
      }

      case "freeFromCategory": {
        const entry = deps.resolveCheapestInCategory?.(reward.categoryId, ctx.cartItems);
        if (entry) {
          const cappedPrice =
            reward.maxValue !== undefined ? Math.min(entry.price, reward.maxValue) : entry.price;
          const inCartQty = ctx.cartItems
            .filter((i) => i.categoryId === reward.categoryId)
            .reduce((s, i) => s + i.quantity, 0);
          const effectiveQty = Math.min(reward.qty, inCartQty);
          if (effectiveQty > 0) {
            discount += cappedPrice * effectiveQty;
            freeItems.push({
              productId: entry.productId,
              qty: effectiveQty,
              unitPrice: cappedPrice,
              source: "freeFromCategory",
            });
          }
        }
        break;
      }

      case "freeShipping":
        freeShipping = true;
        break;
    }
  }

  return { discount: round2(discount), freeItems, freeShipping };
}

export function evaluateCart(
  campaigns: ICampaign[],
  ctx: EvaluationContext,
  deps: EngineDeps = {},
  now: Date = new Date(),
): CampaignEvaluationResult {
  const eligible = campaigns
    .filter((c) => c.isActive && c.status === "active")
    .filter((c) => isWithinWindow(c, now))
    .filter((c) => isUsageAvailable(c))
    .filter((c) => isAudienceMatch(c, ctx))
    .sort((a, b) => b.priority - a.priority);

  const applied: AppliedCampaign[] = [];
  const suggestions: NearMissSuggestion[] = [];
  const allFreeItems: AppliedFreeItem[] = [];
  let totalDiscount = 0;
  let anyApplied = false;
  let freeShipping = false;

  for (const campaign of eligible) {
    const scopedCart = filteredCart(ctx.cartItems, campaign.excludedProductIds);
    const scopedSubtotal = scopedCart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const scopedCtx: EvaluationContext = {
      ...ctx,
      cartItems: scopedCart,
      cartSubtotal: scopedSubtotal,
    };

    if (campaign.minCartTotal !== null && scopedSubtotal < campaign.minCartTotal) {
      const diff = campaign.minCartTotal - scopedSubtotal;
      if (diff <= campaign.minCartTotal * 0.25) {
        suggestions.push({
          campaignId: campaign._id,
          campaignName: campaign.name,
          message: `Spend ${diff.toFixed(2)} more to unlock`,
          remaining: round2(diff),
          unit: "amount",
        });
      }
      continue;
    }

    const allMatch = campaign.conditions.every((c) => matchCondition(c, scopedCtx));
    if (!allMatch) {
      for (const c of campaign.conditions) {
        const remaining = nearMiss(c, scopedCtx);
        if (remaining !== null) {
          suggestions.push({
            campaignId: campaign._id,
            campaignName: campaign.name,
            message: buildNearMissMessage(c, remaining),
            remaining,
            unit: c.type === "cartTotal" ? "amount" : "qty",
          });
          break;
        }
      }
      continue;
    }

    if (anyApplied && !campaign.stackable) continue;

    const { discount, freeItems, freeShipping: fs } = computeRewards(
      campaign.rewards,
      scopedCtx,
      deps,
    );

    applied.push({
      campaignId: campaign._id,
      campaignName: campaign.name,
      campaignType: campaign.type,
      discountAmount: discount,
      freeItems,
      freeShipping: fs,
      rewardsApplied: campaign.rewards,
    });
    totalDiscount += discount;
    allFreeItems.push(...freeItems);
    if (fs) freeShipping = true;
    anyApplied = true;
  }

  return {
    appliedCampaigns: applied,
    freeItems: allFreeItems,
    discountTotal: round2(totalDiscount),
    freeShipping,
    suggestions,
  };
}

function buildNearMissMessage(c: ICondition, remaining: number): string {
  switch (c.type) {
    case "categoryQty":
      return `Add ${remaining} more from this category to unlock`;
    case "productQty":
      return `Add ${remaining} more of this product to unlock`;
    case "specificProducts":
      return `Add ${remaining} more eligible item(s) to unlock`;
    case "cartTotal":
      return `Spend ${remaining.toFixed(2)} more to unlock`;
  }
}

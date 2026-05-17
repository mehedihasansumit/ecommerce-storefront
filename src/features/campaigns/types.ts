import type { LocalizedString } from "@/shared/types/i18n";

export type CampaignType = "bogo" | "bundle" | "tiered" | "freeGift";
export type CampaignStatus = "draft" | "active" | "paused" | "expired";
export type CampaignAudience = "all" | "firstOrder" | "loggedInOnly";

export type ICondition =
  | { type: "categoryQty"; categoryId: string; minQty: number }
  | { type: "productQty"; productId: string; minQty: number }
  | { type: "specificProducts"; productIds: string[]; minQty: number }
  | { type: "cartTotal"; minAmount: number };

export type RewardTarget = "cart" | "category" | "product";

export type IReward =
  | { type: "freeProduct"; productId: string; qty: number }
  | { type: "freeFromCategory"; categoryId: string; qty: number; maxValue?: number }
  | {
      type: "percentDiscount";
      percent: number;
      appliesTo: RewardTarget;
      targetId?: string;
      maxDiscount?: number;
    }
  | { type: "fixedDiscount"; amount: number }
  | { type: "freeShipping" };

export interface ICampaign {
  _id: string;
  storeId: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString | null;
  type: CampaignType;
  status: CampaignStatus;
  priority: number;
  stackable: boolean;
  repeatable: boolean;
  audience: CampaignAudience;
  minCartTotal: number | null;
  startDate: Date;
  endDate: Date;
  usageLimit: number | null;
  perUserLimit: number | null;
  usageCount: number;
  conditions: ICondition[];
  rewards: IReward[];
  excludedProductIds: string[];
  bannerImage: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampaignRedemption {
  _id: string;
  campaignId: string;
  storeId: string;
  userId: string | null;
  orderId: string;
  rewardsApplied: IReward[];
  discountAmount: number;
  redeemedAt: Date;
}

export interface EvaluationCartItem {
  productId: string;
  variantId?: string;
  categoryId?: string;
  quantity: number;
  unitPrice: number;
}

export interface EvaluationContext {
  storeId: string;
  userId?: string;
  isFirstOrder?: boolean;
  cartItems: EvaluationCartItem[];
  cartSubtotal: number;
  shippingCost?: number;
}

export interface AppliedFreeItem {
  productId: string;
  qty: number;
  unitPrice: number;
  source: string;
}

export interface AppliedCampaign {
  campaignId: string;
  campaignName: LocalizedString;
  campaignType: CampaignType;
  discountAmount: number;
  freeItems: AppliedFreeItem[];
  freeShipping: boolean;
  rewardsApplied: IReward[];
}

export interface NearMissSuggestion {
  campaignId: string;
  campaignName: LocalizedString;
  message: string;
  remaining: number;
  unit: "qty" | "amount";
}

export interface CampaignEvaluationResult {
  appliedCampaigns: AppliedCampaign[];
  freeItems: AppliedFreeItem[];
  discountTotal: number;
  freeShipping: boolean;
  suggestions: NearMissSuggestion[];
}

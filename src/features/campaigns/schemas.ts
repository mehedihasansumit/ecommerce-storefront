import { z } from "zod";

const localizedString = z.record(z.string(), z.string()).refine(
  (v) => Object.keys(v).length > 0,
  "At least one locale required",
);

export const conditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("categoryQty"),
    categoryId: z.string().uuid(),
    minQty: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("productQty"),
    productId: z.string().uuid(),
    minQty: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("specificProducts"),
    productIds: z.array(z.string().uuid()).min(1),
    minQty: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("cartTotal"),
    minAmount: z.number().positive(),
  }),
]);

export const rewardSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("freeProduct"),
    productId: z.string().uuid(),
    qty: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("freeFromCategory"),
    categoryId: z.string().uuid(),
    qty: z.number().int().positive(),
    maxValue: z.number().positive().optional(),
  }),
  z.object({
    type: z.literal("percentDiscount"),
    percent: z.number().positive().max(100),
    appliesTo: z.enum(["cart", "category", "product"]),
    targetId: z.string().uuid().optional(),
    maxDiscount: z.number().positive().optional(),
  }),
  z.object({
    type: z.literal("fixedDiscount"),
    amount: z.number().positive(),
  }),
  z.object({ type: z.literal("freeShipping") }),
]);

export const createCampaignSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(60)
      .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
    name: localizedString,
    description: localizedString.optional().nullable(),
    type: z.enum(["bogo", "bundle", "tiered", "freeGift"]),
    status: z.enum(["draft", "active", "paused", "expired"]).optional().default("draft"),
    priority: z.number().int().min(0).optional().default(0),
    stackable: z.boolean().optional().default(false),
    repeatable: z.boolean().optional().default(false),
    audience: z.enum(["all", "firstOrder", "loggedInOnly"]).optional().default("all"),
    minCartTotal: z.number().positive().nullable().optional().default(null),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    usageLimit: z.number().int().positive().nullable().optional().default(null),
    perUserLimit: z.number().int().positive().nullable().optional().default(null),
    conditions: z.array(conditionSchema).min(1, "At least one condition required"),
    rewards: z.array(rewardSchema).min(1, "At least one reward required"),
    excludedProductIds: z.array(z.string().uuid()).optional().default([]),
    bannerImage: z.string().url().nullable().optional().default(null),
    isActive: z.boolean().optional().default(true),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

const createCampaignBase = z.object({
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  name: localizedString,
  description: localizedString.optional().nullable(),
  type: z.enum(["bogo", "bundle", "tiered", "freeGift"]),
  status: z.enum(["draft", "active", "paused", "expired"]).optional(),
  priority: z.number().int().min(0).optional(),
  stackable: z.boolean().optional(),
  repeatable: z.boolean().optional(),
  audience: z.enum(["all", "firstOrder", "loggedInOnly"]).optional(),
  minCartTotal: z.number().positive().nullable().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  conditions: z.array(conditionSchema).min(1),
  rewards: z.array(rewardSchema).min(1),
  excludedProductIds: z.array(z.string().uuid()).optional(),
  bannerImage: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateCampaignSchema = createCampaignBase
  .partial()
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate > data.startDate,
    { message: "endDate must be after startDate", path: ["endDate"] },
  );

export const evaluateCartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        variantSelections: z.record(z.string(), z.string()).optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  shippingCost: z.number().min(0).optional().default(0),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type EvaluateCartInput = z.infer<typeof evaluateCartSchema>;

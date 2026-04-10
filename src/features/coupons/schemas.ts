import { z } from "zod";

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(30, "Code must be at most 30 characters")
    .transform((v) => v.toUpperCase().trim()),
  description: z.string().optional().default(""),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive("Value must be positive"),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxDiscountAmount: z.number().positive().nullable().optional().default(null),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  usageLimit: z.number().int().positive().nullable().optional().default(null),
  perCustomerLimit: z.number().int().positive().optional().default(1),
  applicableProducts: z.array(z.string()).optional().default([]),
  applicableCategories: z.array(z.string()).optional().default([]),
  requiresLogin: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").transform((v) => v.toUpperCase().trim()),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().min(0),
      categoryId: z.string().optional(),
    })
  ),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;

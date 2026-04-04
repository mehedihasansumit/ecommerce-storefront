import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  variantSelections: z.record(z.string(), z.string()).default({}),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
});

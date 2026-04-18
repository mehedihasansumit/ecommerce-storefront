import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().min(1, "Title is required").max(100),
  comment: z.string().max(2000).optional().default(""),
});

export const updateReviewSchema = z.object({
  isApproved: z.boolean(),
});

export const getReviewsQuerySchema = z.object({
  productId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  isApproved: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

// Per-store min/multiples are enforced by PointService.redeem using the store's pointsConfig.
export const redeemPointsSchema = z.object({
  points: z.number().int().positive(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

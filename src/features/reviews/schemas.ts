import { z } from "zod";
import { MIN_REDEMPTION_POINTS } from "@/features/points/types";

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

export const redeemPointsSchema = z.object({
  points: z
    .number()
    .int()
    .min(MIN_REDEMPTION_POINTS, `Minimum redemption is ${MIN_REDEMPTION_POINTS} points`)
    .refine(
      (v) => v % MIN_REDEMPTION_POINTS === 0,
      `Must redeem in multiples of ${MIN_REDEMPTION_POINTS} points`
    ),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
export type RedeemPointsInput = z.infer<typeof redeemPointsSchema>;

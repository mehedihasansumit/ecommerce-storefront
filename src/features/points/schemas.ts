import { z } from "zod";

export const updatePointsConfigSchema = z.object({
  enabled: z.boolean(),
  pointsPerReview: z.number().int().min(0),
  minRedemptionPoints: z.number().int().min(1),
  pointsPerBdt: z.number().int().min(1),
});

export type UpdatePointsConfigInput = z.infer<typeof updatePointsConfigSchema>;

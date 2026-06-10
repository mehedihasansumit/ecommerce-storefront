import { z } from "zod";

export const scanSchema = z.object({
  storeId: z.string().uuid().optional(),
});

export const deleteSchema = z.object({
  storeId: z.string().uuid().optional(),
  keys: z.array(z.string().min(1)).min(1, "At least one key is required"),
});

export type ScanInput = z.infer<typeof scanSchema>;
export type DeleteInput = z.infer<typeof deleteSchema>;

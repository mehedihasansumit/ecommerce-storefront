import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  storeId: z.string().min(1, "storeId is required"),
});

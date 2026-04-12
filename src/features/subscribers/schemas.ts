import { z } from "zod";

export const subscribeSchema = z
  .object({
    storeId: z.string().min(1, "storeId is required"),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().min(7, "Phone number is too short").optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide at least an email or phone number",
  });

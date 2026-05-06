import { z } from "zod";
import { normalizePhone, BD_PHONE_REGEX } from "@/shared/lib/phone";

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      variantSelections: z.record(z.string(), z.string()).default({}),
    })
  ).min(1, "Cart is empty"),
  shippingAddress: z.object({
    name: z.string().min(1, "Name is required"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .transform(normalizePhone)
      .refine((v) => BD_PHONE_REGEX.test(v), "Invalid phone number"),
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().default(""),
    state: z.string().default(""),
    country: z.string().default("Bangladesh"),
  }),
  guestEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  paymentMethod: z.string().default("cod"),
  notes: z.string().optional().default(""),
  couponCode: z.string().optional().default(""),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const createRefundRequestSchema = z.object({
  reason: z.string().min(10, "Please describe the reason (min 10 chars)").max(500),
});
export type CreateRefundRequestInput = z.infer<typeof createRefundRequestSchema>;

export const reviewRefundRequestSchema = z.object({
  action: z.enum(["approved", "rejected", "processed"]),
  adminNote: z.string().max(500).optional(),
  refundAmount: z.number().positive().optional(),
});
export type ReviewRefundRequestInput = z.infer<typeof reviewRefundRequestSchema>;

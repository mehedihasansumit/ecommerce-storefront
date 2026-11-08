import { z } from "zod";
import { normalizePhone, BD_PHONE_REGEX } from "@/shared/lib/phone";

/**
 * Limits on the public checkout body. Every field had none, so one request
 * could carry a huge item list or megabytes of text and tie up the server
 * while it was validated and priced. Each limit is far above a real order.
 */
const MAX_ORDER_LINES = 50;
const MAX_LINE_QUANTITY = 1000;
const field = (max: number) => z.string().max(max);

export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1).max(64),
      quantity: z.number().int().positive().max(MAX_LINE_QUANTITY),
      variantSelections: z
        .record(z.string().max(50), z.string().max(100))
        .refine((v) => Object.keys(v).length <= 10, "Too many options")
        .default({}),
    })
  ).min(1, "Cart is empty").max(MAX_ORDER_LINES, "Too many items in one order"),
  shippingAddress: z.object({
    name: field(120).min(1, "Name is required"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .max(20)
      .transform(normalizePhone)
      .refine((v) => BD_PHONE_REGEX.test(v), "Invalid phone number"),
    street: field(500).min(1, "Street address is required"),
    city: field(120).min(1, "City is required"),
    division: field(120).default(""),
    district: field(120).default(""),
    upazila: field(120).default(""),
    union: field(120).default(""),
    postalCode: field(20).default(""),
    state: field(120).default(""),
    country: field(60).default("Bangladesh"),
  }),
  guestEmail: z.string().max(254).email("Invalid email").optional().or(z.literal("")),
  paymentMethod: field(32).default("cod"),
  notes: field(1000).optional().default(""),
  couponCode: field(64).optional().default(""),
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

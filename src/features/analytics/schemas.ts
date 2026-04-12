import { z } from "zod";

export const trackEventSchema = z.object({
  storeId: z.string().min(1),
  eventType: z.enum(["product_view", "search", "add_to_cart"]),
  productId: z.string().optional(),
  productName: z.string().optional(),
  categoryId: z.string().optional(),
  searchQuery: z.string().max(200).optional(),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

export const analyticsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  metric: z
    .enum([
      "top_viewed",
      "top_purchased",
      "top_searches",
      "revenue_by_category",
      "daily_trend",
      "conversion_funnel",
      "summary",
    ])
    .default("summary"),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

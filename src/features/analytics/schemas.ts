import { z } from "zod";

export const trackEventSchema = z.object({
  storeId: z.string().min(1),
  eventType: z.enum(["product_view", "search", "add_to_cart"]),
  productId: z.string().max(64).optional(),
  productName: z.string().max(300).optional(),
  categoryId: z.string().max(64).optional(),
  searchQuery: z.string().max(200).optional(),
  sessionId: z.string().max(64).optional(),
  userId: z.string().max(64).optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

/** Most events one browser may send in a single /api/track request. */
export const MAX_EVENTS_PER_REQUEST = 20;

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

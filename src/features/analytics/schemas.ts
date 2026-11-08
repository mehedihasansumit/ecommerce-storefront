import { z } from "zod";

/**
 * product_id / category_id are uuid columns. Events are saved in one multi-row
 * INSERT, so a single non-uuid value would fail the whole batch and lose every
 * view in it; refuse such events up front instead.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid = z.string().regex(UUID);

export const trackEventSchema = z.object({
  storeId: z.string().min(1),
  eventType: z.enum(["product_view", "search", "add_to_cart"]),
  productId: uuid.optional(),
  productName: z.string().max(300).optional(),
  categoryId: uuid.optional(),
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

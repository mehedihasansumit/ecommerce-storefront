import { AnalyticsRepository } from "./repository";
import type { TrackEventInput } from "./schemas";
import type { AnalyticsSummary } from "./types";

function parseDateRange(
  from?: string,
  to?: string
): { fromDate: Date; toDate: Date } {
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const fromDate = from
    ? new Date(from)
    : new Date(toDate.getTime() - 30 * 86_400_000);
  fromDate.setHours(0, 0, 0, 0);

  return { fromDate, toDate };
}

/**
 * Activity events are buffered in memory and written in one multi-row INSERT
 * every FLUSH_MS (or as soon as MAX_BUFFER pile up), instead of one INSERT per
 * product view. Analytics only: up to FLUSH_MS of events can be lost if the
 * process dies, which is acceptable for view counts.
 */
const FLUSH_MS = 2000;
const MAX_BUFFER = 500;
let buffer: TrackEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueEvent(event: TrackEventInput): void {
  buffer.push(event);
  if (buffer.length >= MAX_BUFFER) {
    void flushEvents();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => void flushEvents(), FLUSH_MS);
  }
}

/** Writes everything buffered so far. Exported for tests and shutdown hooks. */
export async function flushEvents(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  try {
    await AnalyticsRepository.trackMany(batch);
  } catch (err) {
    console.error(`[analytics] dropped ${batch.length} events:`, err instanceof Error ? err.message : err);
  }
}

export const AnalyticsService = {
  async track(input: TrackEventInput): Promise<void> {
    if (
      (input.eventType === "product_view" ||
        input.eventType === "add_to_cart") &&
      !input.productId
    ) {
      throw new Error("productId required for this event type");
    }
    if (
      input.eventType === "search" &&
      !input.searchQuery?.trim()
    ) {
      return; // silently drop empty searches
    }
    queueEvent(input);
  },

  async getSummary(
    storeId: string,
    from?: string,
    to?: string
  ): Promise<AnalyticsSummary> {
    const { fromDate, toDate } = parseDateRange(from, to);
    return AnalyticsRepository.getSummary(storeId, fromDate, toDate);
  },

  async getMetric(
    storeId: string,
    metric: string,
    from?: string,
    to?: string
  ): Promise<unknown> {
    const { fromDate, toDate } = parseDateRange(from, to);
    switch (metric) {
      case "top_viewed":
        return AnalyticsRepository.getTopViewedProducts(storeId, fromDate, toDate);
      case "top_purchased":
        return AnalyticsRepository.getTopPurchasedProducts(storeId, fromDate, toDate);
      case "top_searches":
        return AnalyticsRepository.getTopSearchQueries(storeId, fromDate, toDate);
      case "revenue_by_category":
        return AnalyticsRepository.getRevenueByCategory(storeId, fromDate, toDate);
      case "daily_trend":
        return AnalyticsRepository.getDailyTrend(storeId, fromDate, toDate);
      case "conversion_funnel":
        return AnalyticsRepository.getConversionFunnel(storeId, fromDate, toDate);
      default:
        return AnalyticsRepository.getSummary(storeId, fromDate, toDate);
    }
  },
};

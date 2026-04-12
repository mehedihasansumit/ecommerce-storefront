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
    return AnalyticsRepository.track(input);
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

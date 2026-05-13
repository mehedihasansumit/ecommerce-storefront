import { and, between, count, countDistinct, desc, eq, isNotNull, ne, sql, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { activityEvents } from "@/db/schema/analytics";
import { orders, orderItems } from "@/db/schema/orders";
import { products } from "@/db/schema/products";
import { categories } from "@/db/schema/categories";
import type { TrackEventInput } from "./schemas";
import type {
  TopProduct,
  TopSearchQuery,
  RevenueByCategory,
  DailyTrend,
  ConversionFunnel,
  AnalyticsSummary,
} from "./types";

function mergeByDate(
  viewRows: { date: string; views: number }[],
  orderRows: { date: string; orders: number; revenue: number }[],
  from: Date,
  to: Date,
): DailyTrend[] {
  const viewMap = new Map(viewRows.map((r) => [r.date, r.views]));
  const orderMap = new Map(orderRows.map((r) => [r.date, { orders: r.orders, revenue: r.revenue }]));
  const result: DailyTrend[] = [];
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);
  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const ord = orderMap.get(dateStr);
    result.push({
      date: dateStr,
      views: viewMap.get(dateStr) ?? 0,
      orders: ord?.orders ?? 0,
      revenue: ord?.revenue ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export const AnalyticsRepository = {
  async track(data: TrackEventInput): Promise<void> {
    await db.insert(activityEvents).values({
      storeId: data.storeId,
      eventType: data.eventType,
      productId: data.productId || null,
      productName: data.productName || null,
      categoryId: data.categoryId || null,
      searchQuery: data.searchQuery || null,
      sessionId: data.sessionId || null,
      userId: data.userId || null,
    });
  },

  async getTopViewedProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<TopProduct[]> {
    const rows = await db
      .select({
        productId: activityEvents.productId,
        productName: sql<string>`MAX(${activityEvents.productName})`,
        cnt: count(),
        uniqueViews: countDistinct(activityEvents.sessionId),
        loggedInViews: sql<number>`SUM(CASE WHEN ${activityEvents.userId} IS NOT NULL THEN 1 ELSE 0 END)`,
        anonymousViews: sql<number>`SUM(CASE WHEN ${activityEvents.userId} IS NULL THEN 1 ELSE 0 END)`,
      })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.storeId, storeId),
          eq(activityEvents.eventType, "product_view"),
          between(activityEvents.createdAt, from, to),
          isNotNull(activityEvents.productId),
        ),
      )
      .groupBy(activityEvents.productId)
      .orderBy(desc(count()))
      .limit(limit);
    return rows.map((r) => ({
      productId: r.productId ?? "",
      productName: r.productName ?? "",
      count: Number(r.cnt),
      uniqueViews: Number(r.uniqueViews),
      loggedInViews: Number(r.loggedInViews),
      anonymousViews: Number(r.anonymousViews),
    }));
  },

  async getTopPurchasedProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit = 10,
  ): Promise<TopProduct[]> {
    const rows = await db
      .select({
        productId: orderItems.productId,
        productName: sql<string>`MAX(${orderItems.productName})`,
        cnt: sum(orderItems.quantity),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.storeId, storeId),
          ne(orders.status, "cancelled"),
          between(orders.createdAt, from, to),
        ),
      )
      .groupBy(orderItems.productId)
      .orderBy(desc(sum(orderItems.quantity)))
      .limit(limit);
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName ?? "",
      count: Number(r.cnt ?? 0),
      uniqueViews: 0,
      loggedInViews: 0,
      anonymousViews: 0,
    }));
  },

  async getTopSearchQueries(
    storeId: string,
    from: Date,
    to: Date,
    limit = 20,
  ): Promise<TopSearchQuery[]> {
    const queryExpr = sql<string>`LOWER(${activityEvents.searchQuery})`;
    const rows = await db
      .select({
        query: queryExpr,
        cnt: count(),
      })
      .from(activityEvents)
      .where(
        and(
          eq(activityEvents.storeId, storeId),
          eq(activityEvents.eventType, "search"),
          between(activityEvents.createdAt, from, to),
          isNotNull(activityEvents.searchQuery),
          sql`${activityEvents.searchQuery} <> ''`,
        ),
      )
      .groupBy(queryExpr)
      .orderBy(desc(count()))
      .limit(limit);
    return rows.map((r) => ({ query: r.query, count: Number(r.cnt) }));
  },

  async getRevenueByCategory(
    storeId: string,
    from: Date,
    to: Date,
  ): Promise<RevenueByCategory[]> {
    const rows = await db
      .select({
        categoryId: products.categoryId,
        categoryName: sql<string>`COALESCE(${categories.name}->>'en', 'Uncategorised')`,
        revenue: sum(orderItems.totalPrice),
        orderCount: countDistinct(orderItems.orderId),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(orders.storeId, storeId),
          ne(orders.status, "cancelled"),
          between(orders.createdAt, from, to),
        ),
      )
      .groupBy(products.categoryId, categories.name)
      .orderBy(desc(sum(orderItems.totalPrice)));
    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      revenue: Number(r.revenue ?? 0),
      orderCount: Number(r.orderCount),
    }));
  },

  async getDailyTrend(storeId: string, from: Date, to: Date): Promise<DailyTrend[]> {
    const [viewRows, orderRows] = await Promise.all([
      db
        .select({
          date: sql<string>`TO_CHAR(${activityEvents.createdAt}, 'YYYY-MM-DD')`,
          views: count(),
        })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.storeId, storeId),
            eq(activityEvents.eventType, "product_view"),
            between(activityEvents.createdAt, from, to),
          ),
        )
        .groupBy(sql`TO_CHAR(${activityEvents.createdAt}, 'YYYY-MM-DD')`),
      db
        .select({
          date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
          orders: count(),
          revenue: sum(orders.total),
        })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, storeId),
            ne(orders.status, "cancelled"),
            between(orders.createdAt, from, to),
          ),
        )
        .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`),
    ]);
    return mergeByDate(
      viewRows.map((r) => ({ date: r.date, views: Number(r.views) })),
      orderRows.map((r) => ({
        date: r.date,
        orders: Number(r.orders),
        revenue: Number(r.revenue ?? 0),
      })),
      from,
      to,
    );
  },

  async getConversionFunnel(storeId: string, from: Date, to: Date): Promise<ConversionFunnel> {
    const [[views], [cartAdds], [purchases]] = await Promise.all([
      db
        .select({ c: count() })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.storeId, storeId),
            eq(activityEvents.eventType, "product_view"),
            between(activityEvents.createdAt, from, to),
          ),
        ),
      db
        .select({ c: count() })
        .from(activityEvents)
        .where(
          and(
            eq(activityEvents.storeId, storeId),
            eq(activityEvents.eventType, "add_to_cart"),
            between(activityEvents.createdAt, from, to),
          ),
        ),
      db
        .select({ c: count() })
        .from(orders)
        .where(
          and(
            eq(orders.storeId, storeId),
            ne(orders.status, "cancelled"),
            between(orders.createdAt, from, to),
          ),
        ),
    ]);
    const v = Number(views.c);
    const ca = Number(cartAdds.c);
    const p = Number(purchases.c);
    return {
      views: v,
      cartAdds: ca,
      purchases: p,
      viewToCartRate: v > 0 ? Math.round((ca / v) * 1000) / 10 : 0,
      cartToPurchaseRate: ca > 0 ? Math.round((p / ca) * 1000) / 10 : 0,
      viewToPurchaseRate: v > 0 ? Math.round((p / v) * 1000) / 10 : 0,
    };
  },

  async getSummary(storeId: string, from: Date, to: Date): Promise<AnalyticsSummary> {
    const [topViewed, topPurchased, topSearches, revenueByCategory, dailyTrend, funnel] =
      await Promise.all([
        this.getTopViewedProducts(storeId, from, to, 10),
        this.getTopPurchasedProducts(storeId, from, to, 10),
        this.getTopSearchQueries(storeId, from, to, 20),
        this.getRevenueByCategory(storeId, from, to),
        this.getDailyTrend(storeId, from, to),
        this.getConversionFunnel(storeId, from, to),
      ]);
    const totalRevenue = dailyTrend.reduce((s, d) => s + d.revenue, 0);
    return {
      totalViews: funnel.views,
      totalOrders: funnel.purchases,
      totalRevenue,
      totalCartAdds: funnel.cartAdds,
      topViewedProducts: topViewed,
      topPurchasedProducts: topPurchased,
      topSearchQueries: topSearches,
      revenueByCategory,
      dailyTrend,
      conversionFunnel: funnel,
    };
  },
};

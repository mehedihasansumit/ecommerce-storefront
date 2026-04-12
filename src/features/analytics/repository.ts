import mongoose from "mongoose";
import dbConnect from "@/shared/lib/db";
import { ActivityEventModel } from "./model";
import { OrderModel } from "@/features/orders/model";
import type { TrackEventInput } from "./schemas";
import type {
  TopProduct,
  TopSearchQuery,
  RevenueByCategory,
  DailyTrend,
  ConversionFunnel,
  AnalyticsSummary,
} from "./types";

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

function mergeByDate(
  viewRows: { _id: string; views: number }[],
  orderRows: { _id: string; orders: number; revenue: number }[],
  from: Date,
  to: Date
): DailyTrend[] {
  const viewMap = new Map(viewRows.map((r) => [r._id, r.views]));
  const orderMap = new Map(
    orderRows.map((r) => [r._id, { orders: r.orders, revenue: r.revenue }])
  );

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
    await dbConnect();
    await ActivityEventModel.create({
      storeId: data.storeId,
      eventType: data.eventType,
      productId: data.productId || null,
      productName: data.productName || "",
      categoryId: data.categoryId || null,
      searchQuery: data.searchQuery || "",
      sessionId: data.sessionId || "",
      userId: data.userId || null,
    });
  },

  async getTopViewedProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit = 10
  ): Promise<TopProduct[]> {
    await dbConnect();
    const results = await ActivityEventModel.aggregate([
      {
        $match: {
          storeId: toObjectId(storeId),
          eventType: "product_view",
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: "$productId",
          productName: { $last: "$productName" },
          count: { $sum: 1 },
          uniqueSessions: { $addToSet: "$sessionId" },
          loggedInViews: {
            $sum: { $cond: [{ $ne: ["$userId", null] }, 1, 0] },
          },
          anonymousViews: {
            $sum: { $cond: [{ $eq: ["$userId", null] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          productId: { $toString: "$_id" },
          productName: 1,
          count: 1,
          uniqueViews: { $size: "$uniqueSessions" },
          loggedInViews: 1,
          anonymousViews: 1,
          _id: 0,
        },
      },
    ]);
    return results;
  },

  async getTopPurchasedProducts(
    storeId: string,
    from: Date,
    to: Date,
    limit = 10
  ): Promise<TopProduct[]> {
    await dbConnect();
    const results = await OrderModel.aggregate([
      {
        $match: {
          storeId: toObjectId(storeId),
          status: { $nin: ["cancelled"] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $last: "$items.productName" },
          count: { $sum: "$items.quantity" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          productId: { $toString: "$_id" },
          productName: 1,
          count: 1,
          _id: 0,
        },
      },
    ]);
    return results;
  },

  async getTopSearchQueries(
    storeId: string,
    from: Date,
    to: Date,
    limit = 20
  ): Promise<TopSearchQuery[]> {
    await dbConnect();
    const results = await ActivityEventModel.aggregate([
      {
        $match: {
          storeId: toObjectId(storeId),
          eventType: "search",
          createdAt: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: { $toLower: "$searchQuery" },
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: "" } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { query: "$_id", count: 1, _id: 0 } },
    ]);
    return results;
  },

  async getRevenueByCategory(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<RevenueByCategory[]> {
    await dbConnect();
    const results = await OrderModel.aggregate([
      {
        $match: {
          storeId: toObjectId(storeId),
          status: { $nin: ["cancelled"] },
          createdAt: { $gte: from, $lte: to },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: { path: "$product", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "categories",
          localField: "product.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: { $ifNull: ["$product.categoryId", null] },
          categoryName: {
            $last: { $ifNull: ["$category.name", "Uncategorised"] },
          },
          revenue: { $sum: "$items.totalPrice" },
          uniqueOrders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          categoryId: { $toString: "$_id" },
          categoryName: 1,
          revenue: 1,
          orderCount: { $size: "$uniqueOrders" },
          _id: 0,
        },
      },
      { $sort: { revenue: -1 } },
    ]);
    return results;
  },

  async getDailyTrend(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<DailyTrend[]> {
    await dbConnect();
    const oid = toObjectId(storeId);
    const [viewRows, orderRows] = await Promise.all([
      ActivityEventModel.aggregate([
        {
          $match: {
            storeId: oid,
            eventType: "product_view",
            createdAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            views: { $sum: 1 },
          },
        },
      ]),
      OrderModel.aggregate([
        {
          $match: {
            storeId: oid,
            status: { $nin: ["cancelled"] },
            createdAt: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
      ]),
    ]);

    return mergeByDate(viewRows, orderRows, from, to);
  },

  async getConversionFunnel(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<ConversionFunnel> {
    await dbConnect();
    const oid = toObjectId(storeId);
    const dateFilter = { $gte: from, $lte: to };

    const [views, cartAdds, purchases] = await Promise.all([
      ActivityEventModel.countDocuments({
        storeId: oid,
        eventType: "product_view",
        createdAt: dateFilter,
      }),
      ActivityEventModel.countDocuments({
        storeId: oid,
        eventType: "add_to_cart",
        createdAt: dateFilter,
      }),
      OrderModel.countDocuments({
        storeId: oid,
        status: { $nin: ["cancelled"] },
        createdAt: dateFilter,
      }),
    ]);

    return {
      views,
      cartAdds,
      purchases,
      viewToCartRate:
        views > 0 ? Math.round((cartAdds / views) * 1000) / 10 : 0,
      cartToPurchaseRate:
        cartAdds > 0 ? Math.round((purchases / cartAdds) * 1000) / 10 : 0,
      viewToPurchaseRate:
        views > 0 ? Math.round((purchases / views) * 1000) / 10 : 0,
    };
  },

  async getSummary(
    storeId: string,
    from: Date,
    to: Date
  ): Promise<AnalyticsSummary> {
    const [
      topViewed,
      topPurchased,
      topSearches,
      revenueByCategory,
      dailyTrend,
      funnel,
    ] = await Promise.all([
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

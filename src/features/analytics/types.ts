import type { Types } from "mongoose";

export type ActivityEventType = "product_view" | "search" | "add_to_cart";

export interface IActivityEvent {
  _id: string;
  storeId: string;
  eventType: ActivityEventType;
  productId?: string;
  productName?: string;
  categoryId?: string;
  searchQuery?: string;
  sessionId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IActivityEventDocument {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  eventType: ActivityEventType;
  productId?: Types.ObjectId | null;
  productName?: string;
  categoryId?: Types.ObjectId | null;
  searchQuery?: string;
  sessionId?: string;
  userId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopProduct {
  productId: string;
  productName: string;
  count: number;
  uniqueViews: number;
  loggedInViews: number;
  anonymousViews: number;
}

export interface TopSearchQuery {
  query: string;
  count: number;
}

export interface RevenueByCategory {
  categoryId: string | null;
  categoryName: string;
  revenue: number;
  orderCount: number;
}

export interface DailyTrend {
  date: string;
  views: number;
  orders: number;
  revenue: number;
}

export interface ConversionFunnel {
  views: number;
  cartAdds: number;
  purchases: number;
  viewToCartRate: number;
  cartToPurchaseRate: number;
  viewToPurchaseRate: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalOrders: number;
  totalRevenue: number;
  totalCartAdds: number;
  topViewedProducts: TopProduct[];
  topPurchasedProducts: TopProduct[];
  topSearchQueries: TopSearchQuery[];
  revenueByCategory: RevenueByCategory[];
  dailyTrend: DailyTrend[];
  conversionFunnel: ConversionFunnel;
}

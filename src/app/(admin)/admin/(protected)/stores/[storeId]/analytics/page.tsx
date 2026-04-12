import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { StoreService } from "@/features/stores/service";
import { AnalyticsService } from "@/features/analytics/service";
import { tAdmin } from "@/shared/lib/i18n";
import Link from "next/link";
import { BarChart2, Eye, ShoppingBag, TrendingUp, Search, ExternalLink } from "lucide-react";

function formatCurrency(value: number) {
  return `৳${value.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.ANALYTICS_VIEW)) redirect("/admin");

  const store = await StoreService.getById(storeId);
  if (!store) notFound();

  const sp = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 30 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  const from = sp.from || defaultFrom;
  const to = sp.to || defaultTo;

  const summary = await AnalyticsService.getSummary(storeId, from, to);

  const maxViews = Math.max(...summary.topViewedProducts.map((p) => p.count), 1);
  const maxPurchased = Math.max(
    ...summary.topPurchasedProducts.map((p) => p.count),
    1
  );
  const maxTrendRevenue = Math.max(
    ...summary.dailyTrend.map((d) => d.revenue),
    1
  );
  const maxTrendViews = Math.max(
    ...summary.dailyTrend.map((d) => d.views),
    1
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
            <BarChart2 size={20} className="text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500">{store.name}</p>
          </div>
        </div>

        {/* Date Range Filter */}
        <form method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Apply
          </button>
        </form>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-cyan-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Product Views
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary.totalViews.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-emerald-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Orders
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary.totalOrders.toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Revenue
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-violet-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              View→Purchase
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {summary.conversionFunnel.viewToPurchaseRate}%
          </p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">
          Conversion Funnel
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-cyan-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-cyan-700">
              {summary.conversionFunnel.views.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Product Views</p>
          </div>
          <div className="text-center px-2">
            <p className="text-xs font-semibold text-gray-400">
              {summary.conversionFunnel.viewToCartRate}%
            </p>
            <p className="text-gray-300 text-lg">→</p>
          </div>
          <div className="flex-1 bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {summary.conversionFunnel.cartAdds.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Cart Adds</p>
          </div>
          <div className="text-center px-2">
            <p className="text-xs font-semibold text-gray-400">
              {summary.conversionFunnel.cartToPurchaseRate}%
            </p>
            <p className="text-gray-300 text-lg">→</p>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">
              {summary.conversionFunnel.purchases.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Orders</p>
          </div>
        </div>
      </div>

      {/* Top Products — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Top Viewed Products
          </h2>
          {summary.topViewedProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No view data yet for this period
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide w-6">
                      #
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Total
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Unique
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Logged-in
                    </th>
                    <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Anon
                    </th>
                    <th className="py-2 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {summary.topViewedProducts.map((p, i) => (
                    <tr
                      key={p.productId}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="py-2.5 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-2.5">
                        <p className="font-medium text-gray-800 truncate max-w-[180px]">
                          {p.productName || "Unknown product"}
                        </p>
                        <div className="mt-1 h-1.5 bg-cyan-50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{
                              width: `${Math.round((p.count / maxViews) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-700">
                        {p.count.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-cyan-600">
                        {p.uniqueViews.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-emerald-600">
                        {p.loggedInViews.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right text-gray-400">
                        {p.anonymousViews.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/admin/stores/${storeId}/products/${p.productId}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors"
                          title="Visit product"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Purchased */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Top Purchased Products
          </h2>
          {summary.topPurchasedProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No orders yet for this period
            </p>
          ) : (
            <ol className="space-y-3">
              {summary.topPurchasedProducts.map((p, i) => (
                <li key={p.productId} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-semibold text-gray-400 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {p.productName || "Unknown product"}
                    </p>
                    <div className="mt-1 h-1.5 bg-emerald-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{
                          width: `${Math.round((p.count / maxPurchased) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 shrink-0">
                    {p.count} units
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Daily Trend Chart */}
      {summary.dailyTrend.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">
            Daily Trend — Revenue & Views
          </h2>
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {summary.dailyTrend.map((day) => (
              <div
                key={day.date}
                className="flex flex-col items-center gap-1 shrink-0"
                style={{ minWidth: `${Math.max(20, Math.floor(100 / summary.dailyTrend.length))}px` }}
                title={`${day.date}: ${formatCurrency(day.revenue)} revenue, ${day.views} views`}
              >
                <div className="flex items-end gap-0.5 h-28 w-full">
                  {/* Revenue bar */}
                  <div
                    className="flex-1 bg-cyan-400 rounded-t opacity-80"
                    style={{
                      height: `${Math.round((day.revenue / maxTrendRevenue) * 100)}%`,
                      minHeight: day.revenue > 0 ? "2px" : "0",
                    }}
                  />
                  {/* Views bar */}
                  <div
                    className="flex-1 bg-violet-300 rounded-t opacity-80"
                    style={{
                      height: `${Math.round((day.views / maxTrendViews) * 100)}%`,
                      minHeight: day.views > 0 ? "2px" : "0",
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 rotate-45 origin-left whitespace-nowrap">
                  {formatDate(day.date)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-cyan-400 rounded-sm" />
              <span className="text-xs text-gray-500">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-violet-300 rounded-sm" />
              <span className="text-xs text-gray-500">Views</span>
            </div>
          </div>
        </div>
      )}

      {/* Revenue by Category */}
      {summary.revenueByCategory.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Revenue by Category
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Revenue
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.revenueByCategory.map((cat) => (
                  <tr
                    key={cat.categoryId ?? "uncategorised"}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2.5 font-medium text-gray-800">
                      {typeof cat.categoryName === "string"
                        ? cat.categoryName
                        : tAdmin(cat.categoryName)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {formatCurrency(cat.revenue)}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {cat.orderCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Searches */}
      {summary.topSearchQueries.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Top Search Queries
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Query
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Searches
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.topSearchQueries.map((q) => (
                  <tr
                    key={q.query}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2.5 font-medium text-gray-800">{q.query}</td>
                    <td className="py-2.5 text-right text-gray-600">
                      {q.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

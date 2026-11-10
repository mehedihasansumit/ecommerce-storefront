import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { StoreService } from "@/features/stores/service";
import { AnalyticsService } from "@/features/analytics/service";
import { tAdmin } from "@/shared/lib/i18n";
import Link from "next/link";
import {
  BarChart2,
  Eye,
  ShoppingBag,
  TrendingUp,
  Search,
  ExternalLink,
  ShoppingCart,
  Receipt,
} from "lucide-react";
import { Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../_components/AdminBreadcrumbs";
import { DateRangeFilter } from "./DateRangeFilter";

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
  const defaultFrom = new Date(today.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  const from = sp.from || defaultFrom;
  const to = sp.to || defaultTo;

  const summary = await AnalyticsService.getSummary(storeId, from, to);

  const avgOrderValue =
    summary.totalOrders > 0
      ? Math.round(summary.totalRevenue / summary.totalOrders)
      : 0;

  const maxViews = Math.max(...summary.topViewedProducts.map((p) => p.count), 1);
  const maxPurchased = Math.max(...summary.topPurchasedProducts.map((p) => p.count), 1);
  const maxTrendRevenue = Math.max(...summary.dailyTrend.map((d) => d.revenue), 1);
  const maxTrendViews = Math.max(...summary.dailyTrend.map((d) => d.views), 1);
  const maxCatRevenue = Math.max(...summary.revenueByCategory.map((c) => c.revenue), 1);
  const maxSearchCount = Math.max(...summary.topSearchQueries.map((q) => q.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`${store.name} · ${from} to ${to}`}
        actions={<DateRangeFilter storeId={storeId} from={from} to={to} />}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Analytics" },
            ]}
          />
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <Eye aria-hidden className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Views
            </span>
          </div>
          <p className="text-xl font-bold text-admin-text-primary">
            {summary.totalViews.toLocaleString()}
          </p>
          <p className="text-xs text-admin-text-muted mt-0.5">product views</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart aria-hidden className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Cart Adds
            </span>
          </div>
          <p className="text-xl font-bold text-admin-text-primary">
            {summary.totalCartAdds.toLocaleString()}
          </p>
          <p className="text-xs text-admin-text-muted mt-0.5">added to cart</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag aria-hidden className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Orders
            </span>
          </div>
          <p className="text-xl font-bold text-admin-text-primary">
            {summary.totalOrders.toLocaleString()}
          </p>
          <p className="text-xs text-admin-text-muted mt-0.5">completed</p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp aria-hidden className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Revenue
            </span>
          </div>
          <p className="text-xl font-bold text-admin-text-primary">
            {formatCurrency(summary.totalRevenue)}
          </p>
          <p className="text-xs text-admin-text-muted mt-0.5">total earned</p>
        </Card>

        <Card padding="md" className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Receipt aria-hidden className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Avg. Order
            </span>
          </div>
          <p className="text-xl font-bold text-admin-text-primary">
            {formatCurrency(avgOrderValue)}
          </p>
          <p className="text-xs text-admin-text-muted mt-0.5">per order</p>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card padding="lg">
        <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide mb-5">
          Conversion Funnel
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
          {/* Views */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Eye aria-hidden className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs font-medium text-admin-text-secondary">Product Views</span>
              </div>
              <span className="text-xs font-bold text-admin-text-primary">
                {summary.conversionFunnel.views.toLocaleString()}
              </span>
            </div>
            <div aria-hidden className="h-2 bg-admin-chip rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-full" />
            </div>
            <p className="text-[11px] text-admin-text-muted mt-1.5">
              <span aria-hidden className="sm:hidden">↓ </span>
              <span aria-hidden className="hidden sm:inline">→ </span>
              {summary.conversionFunnel.viewToCartRate}% added to cart
            </p>
          </div>

          {/* Cart Adds */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShoppingCart aria-hidden className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-admin-text-secondary">Cart Adds</span>
              </div>
              <span className="text-xs font-bold text-admin-text-primary">
                {summary.conversionFunnel.cartAdds.toLocaleString()}
              </span>
            </div>
            <div aria-hidden className="h-2 bg-admin-chip rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{
                  width: `${summary.conversionFunnel.viewToCartRate}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-admin-text-muted mt-1.5">
              <span aria-hidden className="sm:hidden">↓ </span>
              <span aria-hidden className="hidden sm:inline">→ </span>
              {summary.conversionFunnel.cartToPurchaseRate}% purchased
            </p>
          </div>

          {/* Purchases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShoppingBag aria-hidden className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-admin-text-secondary">Purchases</span>
              </div>
              <span className="text-xs font-bold text-admin-text-primary">
                {summary.conversionFunnel.purchases.toLocaleString()}
              </span>
            </div>
            <div aria-hidden className="h-2 bg-admin-chip rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{
                  width: `${summary.conversionFunnel.viewToPurchaseRate}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-admin-text-muted mt-1.5">
              {summary.conversionFunnel.viewToPurchaseRate}% view-to-purchase
            </p>
          </div>
        </div>
      </Card>

      {/* Daily Trend Chart */}
      {summary.dailyTrend.length > 0 && (
        <Card padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
              Daily Trend
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div aria-hidden className="w-2.5 h-2.5 bg-blue-400 rounded-sm" />
                <span className="text-xs text-admin-text-muted">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div aria-hidden className="w-2.5 h-2.5 bg-violet-300 rounded-sm" />
                <span className="text-xs text-admin-text-muted">Views</span>
              </div>
            </div>
          </div>
          <div className="relative overflow-x-auto">
            <div
              className="flex items-end gap-1 h-44 pb-6"
              style={{ minWidth: `${summary.dailyTrend.length * 28}px` }}
            >
              {summary.dailyTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex flex-col items-center gap-0.5 flex-1 group/bar"
                  title={`${day.date}: ${formatCurrency(day.revenue)} revenue · ${day.views} views · ${day.orders} orders`}
                >
                  <div className="flex items-end gap-px h-32 w-full">
                    <div
                      className="flex-1 bg-blue-400 rounded-t transition-opacity group-hover/bar:opacity-100 opacity-80"
                      style={{
                        height: `${Math.round((day.revenue / maxTrendRevenue) * 100)}%`,
                        minHeight: day.revenue > 0 ? "2px" : "0",
                      }}
                    />
                    <div
                      className="flex-1 bg-violet-300 rounded-t transition-opacity group-hover/bar:opacity-100 opacity-80"
                      style={{
                        height: `${Math.round((day.views / maxTrendViews) * 100)}%`,
                        minHeight: day.views > 0 ? "2px" : "0",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-admin-text-muted whitespace-nowrap rotate-45 origin-left mt-1 block">
                    {formatDate(day.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top Products — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
              Top Viewed Products
            </h2>
          </div>
          {summary.topViewedProducts.length === 0 ? (
            <EmptyState icon={Eye} title="No view data for this period" />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-admin-surface-raised">
                  <tr>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide w-6">
                      #
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Product
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Views
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Uniq
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Guest
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Members
                    </th>
                    <th scope="col" className="px-5 py-3 w-8">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {summary.topViewedProducts.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-admin-surface-hover/60 transition-colors">
                      <td className="px-5 py-3 text-xs text-admin-text-muted">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-admin-text-secondary truncate max-w-40">
                          {p.productName || "Unknown"}
                        </p>
                        <div aria-hidden className="mt-1.5 h-1 bg-admin-chip rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.round((p.count / maxViews) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-admin-text-secondary">
                        {p.count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-cyan-700 dark:text-cyan-400 text-xs">
                        {p.uniqueViews.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-admin-text-muted text-xs">
                        {p.anonymousViews.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-violet-700 dark:text-violet-400 text-xs">
                        {p.loggedInViews.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/stores/${storeId}/products/${p.productId}`}
                          className={buttonClassName({ variant: "ghost", size: "icon" })}
                          title="Open product"
                          aria-label={`Open product ${p.productName || "Unknown"}`}
                        >
                          <ExternalLink aria-hidden size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Top Purchased */}
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
              Top Purchased Products
            </h2>
          </div>
          {summary.topPurchasedProducts.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders for this period" />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-admin-surface-raised">
                  <tr>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide w-6">
                      #
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Product
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Units
                    </th>
                    <th scope="col" className="px-5 py-3 w-8">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {summary.topPurchasedProducts.map((p, i) => (
                    <tr key={p.productId} className="hover:bg-admin-surface-hover/60 transition-colors">
                      <td className="px-5 py-3 text-xs text-admin-text-muted">{i + 1}</td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-admin-text-secondary truncate max-w-44">
                          {p.productName || "Unknown"}
                        </p>
                        <div aria-hidden className="mt-1.5 h-1 bg-admin-chip rounded-full overflow-hidden w-full">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${Math.round((p.count / maxPurchased) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-admin-text-secondary">
                        {p.count.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/stores/${storeId}/products/${p.productId}`}
                          className={buttonClassName({ variant: "ghost", size: "icon" })}
                          title="Open product"
                          aria-label={`Open product ${p.productName || "Unknown"}`}
                        >
                          <ExternalLink aria-hidden size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Revenue by Category + Top Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        {summary.revenueByCategory.length > 0 && (
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Revenue by Category
              </h2>
            </div>
            <div className="divide-y divide-admin-border">
              {summary.revenueByCategory.map((cat) => (
                <div
                  key={cat.categoryId ?? "uncategorised"}
                  className="px-5 py-3 hover:bg-admin-surface-hover/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-admin-text-secondary">
                      {typeof cat.categoryName === "string"
                        ? cat.categoryName
                        : tAdmin(cat.categoryName)}
                    </span>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-xs text-admin-text-muted">
                        {cat.orderCount} orders
                      </span>
                      <span className="text-sm font-semibold text-admin-text-secondary w-24 text-right">
                        {formatCurrency(cat.revenue)}
                      </span>
                    </div>
                  </div>
                  <div aria-hidden className="h-1 bg-admin-chip rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.round((cat.revenue / maxCatRevenue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top Search Queries */}
        {summary.topSearchQueries.length > 0 && (
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
              <Search aria-hidden className="w-3.5 h-3.5 text-admin-text-muted" />
              <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                Top Search Queries
              </h2>
            </div>
            <div className="divide-y divide-admin-border">
              {summary.topSearchQueries.map((q, i) => (
                <div
                  key={q.query}
                  className="px-5 py-3 hover:bg-admin-surface-hover/60 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-admin-text-muted w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-admin-text-secondary break-all">{q.query}</span>
                    </div>
                    <span className="text-sm font-semibold text-admin-text-secondary">
                      {q.count.toLocaleString()}
                    </span>
                  </div>
                  <div aria-hidden className="h-1 bg-admin-chip rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${Math.round((q.count / maxSearchCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Empty state if everything is zero */}
      {summary.totalViews === 0 &&
        summary.totalOrders === 0 &&
        summary.totalCartAdds === 0 && (
          <Card padding="none">
            <EmptyState
              icon={BarChart2}
              title="No data for this period"
              description="Try selecting a wider date range or check back after customers visit your store."
            />
          </Card>
        )}
    </div>
  );
}

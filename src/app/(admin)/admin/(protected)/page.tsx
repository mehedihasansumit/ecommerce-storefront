import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { and, count, desc, eq, inArray, sql, sum, type SQL } from "drizzle-orm";
import { StoreService } from "@/features/stores/service";
import { db } from "@/db/client";
import { products } from "@/db/schema/products";
import { orders } from "@/db/schema/orders";
import { getAdminDbUser } from "@/shared/lib/auth";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { OrderStatus } from "@/features/orders/types";

export const metadata: Metadata = { title: "Admin Dashboard" };

function formatCurrency(value: number) {
  return `৳${value.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  processing: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  shipped: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function AdminDashboardPage() {
  const adminUser = await getAdminDbUser();
  const isSuperAdmin = adminUser?.role.isSuperAdmin ?? false;

  const canViewOrders = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW) : false);
  const canViewPayments = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.PAYMENTS_VIEW) : false);
  const canCreateStore = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.STORES_CREATE) : false);
  const canEditStore = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.STORES_EDIT) : false);

  const assignedStores: string[] = adminUser?.assignedStores ?? [];
  const allStores = await StoreService.getAll();
  const visibleStores = isSuperAdmin
    ? allStores
    : allStores.filter((s) =>
        assignedStores.length === 0 ? true : assignedStores.includes(s._id)
      );

  const storeIds = visibleStores.map((s) => s._id);
  const productScope: SQL | undefined = storeIds.length > 0 ? inArray(products.storeId, storeIds) : undefined;
  const orderScope: SQL | undefined = storeIds.length > 0 ? inArray(orders.storeId, storeIds) : undefined;

  const [
    productCountRow,
    orderCountRow,
    revenueRow,
    recentOrderRows,
    storeStats,
    pendingCountRow,
  ] = await Promise.all([
    db.select({ c: count() }).from(products).where(productScope),
    canViewOrders ? db.select({ c: count() }).from(orders).where(orderScope) : Promise.resolve(null),
    canViewPayments
      ? db
          .select({ total: sum(orders.total) })
          .from(orders)
          .where(orderScope ? and(orderScope, eq(orders.paymentStatus, "paid")) : eq(orders.paymentStatus, "paid"))
      : Promise.resolve(null),
    canViewOrders
      ? db.select().from(orders).where(orderScope).orderBy(desc(orders.createdAt)).limit(10)
      : Promise.resolve(null),
    canViewOrders || canViewPayments
      ? db
          .select({
            storeId: orders.storeId,
            orderCount: count(),
            revenue: sum(orders.total),
          })
          .from(orders)
          .where(orderScope)
          .groupBy(orders.storeId)
      : Promise.resolve(null),
    canViewOrders
      ? db
          .select({ c: count() })
          .from(orders)
          .where(orderScope ? and(orderScope, eq(orders.status, "pending")) : eq(orders.status, "pending"))
      : Promise.resolve(null),
  ]);

  const productCount = Number(productCountRow[0]?.c ?? 0);
  const orderCount = orderCountRow ? Number(orderCountRow[0]?.c ?? 0) : null;
  const totalRevenue = revenueRow ? Number(revenueRow[0]?.total ?? 0) : 0;
  const pendingCount = pendingCountRow ? Number(pendingCountRow[0]?.c ?? 0) : null;

  const storeStatsMap = Object.fromEntries(
    (storeStats ?? []).map((s) => [
      s.storeId,
      { orderCount: Number(s.orderCount ?? 0), revenue: Number(s.revenue ?? 0) },
    ])
  );

  const storeNameMap = Object.fromEntries(visibleStores.map((s) => [s._id, s.name]));

  const recentOrders = (recentOrderRows ?? []).map((o) => ({
    _id: o.id,
    orderNumber: o.orderNumber,
    storeId: o.storeId,
    shippingAddress: o.shippingAddress as { name?: string },
    guestPhone: o.guestPhone ?? undefined,
    guestEmail: o.guestEmail ?? undefined,
    items: { length: 0 },
    total: Number(o.total),
    status: o.status as OrderStatus,
    createdAt: o.createdAt.toISOString(),
  }));
  void sql;

  const kpiClass = "shadow-sm";
  const thClass = "px-4 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";
  type RecentOrder = (typeof recentOrders)[number];
  const customerOf = (order: RecentOrder) =>
    order.shippingAddress?.name || order.guestPhone || order.guestEmail || "Guest";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={adminUser ? `Welcome back, ${adminUser.name}` : undefined}
        actions={
          <>
            {canCreateStore && (
              <Link href="/admin/stores/new" className={buttonClassName({ variant: "primary", size: "md" })}>
                <Plus size={16} aria-hidden />
                New Store
              </Link>
            )}
            {canViewOrders && (
              <Link href="/admin/orders" className={buttonClassName({ variant: "secondary", size: "md" })}>
                <ShoppingBag size={16} aria-hidden />
                All Orders
              </Link>
            )}
          </>
        }
      />

      {/* KPI Cards */}
      <section aria-label="Key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stores — always visible */}
        <Card padding="md" className={`${kpiClass} sm:p-5`}>
          <KpiLabel icon={Store} tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            Stores
          </KpiLabel>
          <p className="text-2xl font-bold text-admin-text-primary">{visibleStores.length}</p>
          <p className="text-xs text-admin-text-muted mt-1">
            {visibleStores.filter((s) => s.isActive).length} active
          </p>
        </Card>

        {/* Products — always visible */}
        <Card padding="md" className={`${kpiClass} sm:p-5`}>
          <KpiLabel icon={Package} tint="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            Products
          </KpiLabel>
          <p className="text-2xl font-bold text-admin-text-primary">{productCount.toLocaleString()}</p>
          <p className="text-xs text-admin-text-muted mt-1">across all stores</p>
        </Card>

        {/* Orders — only with ORDERS_VIEW */}
        {canViewOrders && (
          <Card padding="md" className={`${kpiClass} sm:p-5`}>
            <KpiLabel icon={ShoppingBag} tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              Orders
            </KpiLabel>
            <p className="text-2xl font-bold text-admin-text-primary">{(orderCount ?? 0).toLocaleString()}</p>
            {(pendingCount ?? 0) > 0 && (
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                {pendingCount} pending
              </p>
            )}
          </Card>
        )}

        {/* Revenue — only with PAYMENTS_VIEW */}
        {canViewPayments && (
          <Card padding="md" className={`${kpiClass} sm:p-5`}>
            <KpiLabel icon={TrendingUp} tint="bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
              Revenue
            </KpiLabel>
            <p className="text-2xl font-bold text-admin-text-primary">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-admin-text-muted mt-1">paid orders only</p>
          </Card>
        )}
      </section>

      {/* Store Performance — visible if user can view/edit stores or has order/payment access */}
      {(canEditStore || canCreateStore || canViewOrders || canViewPayments) && visibleStores.length > 0 && (
        <section aria-labelledby="store-performance-heading">
          <h2
            id="store-performance-heading"
            className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wide mb-4"
          >
            Store Performance
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleStores.map((store) => {
              const stats = storeStatsMap[store._id] ?? {
                orderCount: 0,
                revenue: 0,
              };
              return (
                <li key={store._id}>
                  <Card padding="md" className="h-full shadow-sm sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-admin-text-primary truncate">{store.name}</h3>
                        {store.domains?.[0] && (
                          <span className="inline-block mt-1 text-xs text-admin-chip-text bg-admin-chip px-2 py-0.5 rounded-full truncate max-w-full">
                            {store.domains[0]}
                          </span>
                        )}
                      </div>
                      <StoreStatus active={store.isActive} />
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      {canViewOrders && (
                        <div>
                          <p className="text-lg font-bold text-admin-text-primary">
                            {stats.orderCount.toLocaleString()}
                          </p>
                          <p className="text-xs text-admin-text-muted">orders</p>
                        </div>
                      )}
                      {canViewOrders && canViewPayments && (
                        <div aria-hidden className="w-px h-8 bg-admin-border" />
                      )}
                      {canViewPayments && (
                        <div>
                          <p className="text-lg font-bold text-admin-text-primary">
                            {formatCurrency(stats.revenue)}
                          </p>
                          <p className="text-xs text-admin-text-muted">revenue</p>
                        </div>
                      )}
                    </div>

                    {(canEditStore || canCreateStore) && (
                      <Link
                        href={`/admin/stores/${store._id}`}
                        aria-label={`Manage store ${store.name}`}
                        className="inline-flex items-center gap-1 py-1 rounded text-xs font-medium text-admin-text-muted hover:text-admin-text-primary transition-colors focus-ring"
                      >
                        Manage store
                        <ExternalLink size={11} aria-hidden />
                      </Link>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Recent Orders — only with ORDERS_VIEW */}
      {canViewOrders && (
        <section aria-labelledby="recent-orders-heading">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2
              id="recent-orders-heading"
              className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wide"
            >
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="py-1 rounded text-xs text-admin-text-muted hover:text-admin-text-primary transition-colors focus-ring"
            >
              View all <span aria-hidden>→</span>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <Card padding="none" className="shadow-sm">
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="New orders from your stores will show up here."
              />
            </Card>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="flex flex-col gap-3 sm:hidden">
                {recentOrders.map((order) => (
                  <li key={order._id}>
                    <Card padding="md" className="shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-admin-text-secondary">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-admin-text-muted mt-0.5">
                            {storeNameMap[order.storeId] ?? "—"}
                          </p>
                        </div>
                        <OrderStatusPill status={order.status} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-admin-text-secondary truncate max-w-40">{customerOf(order)}</p>
                        <div className="text-right shrink-0">
                          {canViewPayments && (
                            <p className="text-xs font-semibold text-admin-text-secondary">
                              {formatCurrency(order.total)}
                            </p>
                          )}
                          <p className="text-xs text-admin-text-muted">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <Card padding="none" className="hidden sm:block shadow-sm overflow-hidden">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-admin-border bg-admin-surface-raised">
                        <th scope="col" className={`text-left ${thClass}`}>Order</th>
                        <th scope="col" className={`text-left ${thClass}`}>Store</th>
                        <th scope="col" className={`text-left ${thClass}`}>Customer</th>
                        {canViewPayments && (
                          <th scope="col" className={`text-right ${thClass}`}>Total</th>
                        )}
                        <th scope="col" className={`text-left ${thClass}`}>Status</th>
                        <th scope="col" className={`text-right ${thClass}`}>Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border">
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-admin-surface-hover transition-colors">
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                              className="rounded font-mono text-xs font-semibold text-admin-text-secondary hover:text-admin-text-primary transition-colors focus-ring"
                            >
                              #{order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-admin-text-secondary">{storeNameMap[order.storeId] ?? "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-admin-text-secondary truncate max-w-30 block">
                              {customerOf(order)}
                            </span>
                          </td>
                          {canViewPayments && (
                            <td className="px-4 py-3 text-right font-semibold text-admin-text-secondary text-xs">
                              {formatCurrency(order.total)}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <OrderStatusPill status={order.status} />
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-admin-text-muted whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function KpiLabel({ icon: Icon, tint, children }: { icon: LucideIcon; tint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div aria-hidden className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>
        <Icon size={15} />
      </div>
      <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">{children}</span>
    </div>
  );
}

/** Status is spelled out in text, so colour is never the only signal. */
function OrderStatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block shrink-0 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
        STATUS_STYLES[status] ?? "bg-admin-chip text-admin-chip-text"
      }`}
    >
      {status}
    </span>
  );
}

function StoreStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-admin-chip text-admin-chip-text"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

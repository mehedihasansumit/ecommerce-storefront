import type { Metadata } from "next";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  Plus,
  ExternalLink,
} from "lucide-react";
import { StoreService } from "@/features/stores/service";
import { ProductModel } from "@/features/products/model";
import { OrderModel } from "@/features/orders/model";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import dbConnect from "@/shared/lib/db";
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
  await dbConnect();

  const adminUser = await getAdminDbUser();
  const isSuperAdmin = adminUser?.role.isSuperAdmin ?? false;

  // Resolve permissions
  const canViewOrders = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW) : false);
  const canViewPayments = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.PAYMENTS_VIEW) : false);
  const canCreateStore = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.STORES_CREATE) : false);
  const canEditStore = isSuperAdmin || (adminUser ? hasPermission(adminUser, PERMISSIONS.STORES_EDIT) : false);

  // Visible stores: superadmin sees all, others filtered by assignedStores
  const assignedStores: string[] = adminUser?.assignedStores ?? [];
  const allStores = await StoreService.getAll();
  const visibleStores = isSuperAdmin
    ? allStores
    : allStores.filter((s) =>
        assignedStores.length === 0 ? true : assignedStores.includes(s._id)
      );

  const storeIds = visibleStores.map((s) => s._id);
  const storeIdFilter =
    storeIds.length > 0 ? { storeId: { $in: storeIds } } : {};

  // Conditionally fetch based on permissions
  const [
    productCount,
    orderCount,
    revenueAgg,
    recentOrdersDocs,
    storeStats,
    pendingCount,
  ] = await Promise.all([
    ProductModel.countDocuments(storeIdFilter),
    canViewOrders ? OrderModel.countDocuments(storeIdFilter) : Promise.resolve(null),
    canViewPayments
      ? OrderModel.aggregate([
          { $match: { ...storeIdFilter, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$total" } } },
        ])
      : Promise.resolve(null),
    canViewOrders
      ? OrderModel.find(storeIdFilter).sort({ createdAt: -1 }).limit(10).lean()
      : Promise.resolve(null),
    canViewPayments
      ? OrderModel.aggregate([
          { $match: storeIdFilter },
          {
            $group: {
              _id: "$storeId",
              orderCount: { $sum: 1 },
              revenue: { $sum: "$total" },
            },
          },
        ])
      : canViewOrders
      ? OrderModel.aggregate([
          { $match: storeIdFilter },
          { $group: { _id: "$storeId", orderCount: { $sum: 1 } } },
        ])
      : Promise.resolve(null),
    canViewOrders
      ? OrderModel.countDocuments({ ...storeIdFilter, status: "pending" })
      : Promise.resolve(null),
  ]);

  const totalRevenue: number = revenueAgg?.[0]?.total ?? 0;

  const storeStatsMap = Object.fromEntries(
    (storeStats ?? []).map(
      (s: { _id: { toString(): string }; orderCount?: number; revenue?: number }) => [
        s._id.toString(),
        { orderCount: s.orderCount ?? 0, revenue: s.revenue ?? 0 },
      ]
    )
  );

  const storeNameMap = Object.fromEntries(
    visibleStores.map((s) => [s._id, s.name])
  );

  const recentOrders = recentOrdersDocs
    ? JSON.parse(JSON.stringify(recentOrdersDocs))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Dashboard</h1>
          {adminUser && (
            <p className="text-sm text-admin-text-muted mt-0.5">
              Welcome back, {adminUser.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCreateStore && (
            <Link
              href="/admin/stores/new"
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={15} />
              <span className="hidden sm:inline">New Store</span>
            </Link>
          )}
          {canViewOrders && (
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-admin-border-md text-admin-text-secondary rounded-lg hover:bg-admin-surface-hover transition-colors"
            >
              <ShoppingBag size={15} />
              <span className="hidden sm:inline">All Orders</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stores — always visible */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center">
              <Store size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Stores
            </span>
          </div>
          <p className="text-2xl font-bold text-admin-text-primary">
            {visibleStores.length}
          </p>
          <p className="text-xs text-admin-text-subtle mt-1">
            {visibleStores.filter((s) => s.isActive).length} active
          </p>
        </div>

        {/* Products — always visible */}
        <div className="bg-admin-surface border border-admin-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-violet-50 dark:bg-violet-950 rounded-lg flex items-center justify-center">
              <Package size={15} className="text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
              Products
            </span>
          </div>
          <p className="text-2xl font-bold text-admin-text-primary">
            {productCount.toLocaleString()}
          </p>
          <p className="text-xs text-admin-text-subtle mt-1">across all stores</p>
        </div>

        {/* Orders — only with ORDERS_VIEW */}
        {canViewOrders && (
          <div className="bg-admin-surface border border-admin-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
                <ShoppingBag size={15} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
                Orders
              </span>
            </div>
            <p className="text-2xl font-bold text-admin-text-primary">
              {(orderCount ?? 0).toLocaleString()}
            </p>
            {(pendingCount ?? 0) > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                {pendingCount} pending
              </p>
            )}
          </div>
        )}

        {/* Revenue — only with PAYMENTS_VIEW */}
        {canViewPayments && (
          <div className="bg-admin-surface border border-admin-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-cyan-50 dark:bg-cyan-950 rounded-lg flex items-center justify-center">
                <TrendingUp size={15} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
                Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-admin-text-primary">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-admin-text-subtle mt-1">paid orders only</p>
          </div>
        )}
      </div>

      {/* Store Performance — visible if user can view/edit stores or has order/payment access */}
      {(canEditStore || canCreateStore || canViewOrders || canViewPayments) && visibleStores.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wide mb-4">
            Store Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleStores.map((store) => {
              const stats = storeStatsMap[store._id] ?? {
                orderCount: 0,
                revenue: 0,
              };
              return (
                <div
                  key={store._id}
                  className="bg-admin-surface border border-admin-border rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-admin-text-primary truncate">
                        {store.name}
                      </p>
                      {store.domains?.[0] && (
                        <span className="inline-block mt-1 text-xs text-admin-chip-text bg-admin-chip px-2 py-0.5 rounded-full truncate max-w-full">
                          {store.domains[0]}
                        </span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        store.isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-admin-chip text-admin-chip-text"
                      }`}
                    >
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    {canViewOrders && (
                      <div>
                        <p className="text-lg font-bold text-admin-text-primary">
                          {stats.orderCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-admin-text-subtle">orders</p>
                      </div>
                    )}
                    {canViewOrders && canViewPayments && (
                      <div className="w-px h-8 bg-admin-border" />
                    )}
                    {canViewPayments && (
                      <div>
                        <p className="text-lg font-bold text-admin-text-primary">
                          {formatCurrency(stats.revenue)}
                        </p>
                        <p className="text-xs text-admin-text-subtle">revenue</p>
                      </div>
                    )}
                  </div>

                  {(canEditStore || canCreateStore) && (
                    <Link
                      href={`/admin/stores/${store._id}`}
                      className="flex items-center gap-1 text-xs font-medium text-admin-text-muted hover:text-admin-text-primary transition-colors"
                    >
                      Manage store
                      <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders — only with ORDERS_VIEW */}
      {canViewOrders && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-admin-text-secondary uppercase tracking-wide">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-admin-text-muted hover:text-admin-text-primary transition-colors"
            >
              View all →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="bg-admin-surface border border-admin-border rounded-xl shadow-sm">
              <p className="text-sm text-admin-text-subtle text-center py-10">No orders yet</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="flex flex-col gap-3 sm:hidden">
                {recentOrders.map(
                  (order: {
                    _id: string;
                    orderNumber: string;
                    storeId: string;
                    shippingAddress?: { name?: string };
                    guestPhone?: string;
                    guestEmail?: string;
                    items: { length: number };
                    total: number;
                    status: OrderStatus;
                    createdAt: string;
                  }) => (
                    <div key={order._id} className="bg-admin-surface border border-admin-border rounded-xl shadow-sm p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-admin-text-secondary">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-admin-text-subtle mt-0.5">
                            {storeNameMap[order.storeId] ?? "—"}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${
                            STATUS_STYLES[order.status] ?? "bg-admin-chip text-admin-chip-text"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-admin-text-secondary truncate max-w-40">
                          {order.shippingAddress?.name || order.guestPhone || order.guestEmail || "Guest"}
                        </p>
                        <div className="text-right shrink-0">
                          {canViewPayments && (
                            <p className="text-xs font-semibold text-admin-text-secondary">{formatCurrency(order.total)}</p>
                          )}
                          <p className="text-xs text-admin-text-subtle">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block bg-admin-surface border border-admin-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-admin-border bg-admin-surface-raised">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Order</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Store</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Customer</th>
                        {canViewPayments && (
                          <th className="text-right px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Total</th>
                        )}
                        <th className="text-left px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Status</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map(
                        (order: {
                          _id: string;
                          orderNumber: string;
                          storeId: string;
                          shippingAddress?: { name?: string };
                          guestPhone?: string;
                          guestEmail?: string;
                          items: { length: number };
                          total: number;
                          status: OrderStatus;
                          createdAt: string;
                        }) => (
                          <tr
                            key={order._id}
                            className="border-b border-admin-border hover:bg-admin-surface-hover transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Link
                                href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                                className="font-mono text-xs font-semibold text-admin-text-secondary hover:text-admin-text-primary"
                              >
                                #{order.orderNumber}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-admin-text-secondary">{storeNameMap[order.storeId] ?? "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-admin-text-secondary truncate max-w-30 block">
                                {order.shippingAddress?.name || order.guestPhone || order.guestEmail || "Guest"}
                              </span>
                            </td>
                            {canViewPayments && (
                              <td className="px-4 py-3 text-right font-semibold text-admin-text-secondary text-xs">
                                {formatCurrency(order.total)}
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                                  STATUS_STYLES[order.status] ?? "bg-admin-chip text-admin-chip-text"
                                }`}
                              >
                                {order.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-admin-text-subtle whitespace-nowrap">
                              {formatDate(order.createdAt)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

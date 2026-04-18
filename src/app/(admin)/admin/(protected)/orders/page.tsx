import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";
import { OrderRepository } from "@/features/orders/repository";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { OrderStatus } from "@/features/orders/types";

export const metadata: Metadata = { title: "All Orders" };

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const PAYMENT_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  paid:     "bg-green-100 text-green-800",
  failed:   "bg-red-100 text-red-800",
  refunded: "bg-admin-chip text-admin-text-secondary",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; storeId?: string; page?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW)) redirect("/admin");

  const { status, storeId: filterStore, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1);

  const [{ orders, total }, stores] = await Promise.all([
    OrderRepository.findAll({
      page,
      limit: PAGE_SIZE,
      status: status || undefined,
      storeId: filterStore || undefined,
    }),
    StoreService.getAll(),
  ]);

  const storeMap = Object.fromEntries(stores.map((s) => [s._id, s.name]));
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function href(params: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      status,
      storeId: filterStore,
      page: undefined,
      ...params,
    };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  function pageHref(p: number) {
    return href({ page: String(p), status, storeId: filterStore });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">All Orders</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {total} {total === 1 ? "order" : "orders"} across all stores
          </p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <Link
          href={href({ status: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
          }`}
        >
          All Status
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={href({ status: s })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              status === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Store filter */}
      {stores.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          <Link
            href={href({ storeId: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !filterStore
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
            }`}
          >
            All Stores
          </Link>
          {stores.map((s) => (
            <Link
              key={s._id}
              href={href({ storeId: s._id })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterStore === s._id
                  ? "bg-gray-700 text-white border-gray-700"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
              }`}
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No orders found</h3>
          <p className="text-sm text-admin-text-muted">
            {status || filterStore ? "Try removing some filters." : "Orders will appear here once placed."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {orders.map((order) => (
              <div key={order._id} className="bg-admin-surface rounded-xl border border-admin-border-md p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-admin-text-primary">{order.orderNumber}</p>
                    <p className="text-xs text-admin-text-muted mt-0.5">{storeMap[order.storeId] ?? "—"}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${
                      STATUS_STYLES[order.status] ?? "bg-admin-chip text-admin-text-secondary"
                    }`}
                  >
                    {order.status === "pending" && <Clock className="w-3 h-3" />}
                    {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                    {order.status === "shipped" && <Truck className="w-3 h-3" />}
                    {order.status === "cancelled" && <XCircle className="w-3 h-3" />}
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-admin-text-primary">{order.shippingAddress.name}</p>
                    <p className="text-xs text-admin-text-subtle">{order.shippingAddress.phone || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-admin-text-primary">৳{order.total.toLocaleString()}</p>
                    <p className="text-xs text-admin-text-subtle">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-admin-border">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      PAYMENT_STYLES[order.paymentStatus] ?? "bg-admin-chip text-admin-text-secondary"
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-admin-text-subtle">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                    <Link
                      href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-200">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Store</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Items</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Payment</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-admin-surface-raised/60 transition-colors group">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-admin-text-primary">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-admin-text-secondary">
                        {storeMap[order.storeId] ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-admin-text-primary">{order.shippingAddress.name}</p>
                        <p className="text-xs text-admin-text-subtle mt-0.5">{order.shippingAddress.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-admin-text-secondary">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </div>
                        <div className="text-xs text-admin-text-subtle mt-0.5 max-w-40 truncate">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-admin-text-primary">
                          ৳{order.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            STATUS_STYLES[order.status] ?? "bg-admin-chip text-admin-text-secondary"
                          }`}
                        >
                          {order.status === "pending" && <Clock className="w-3 h-3" />}
                          {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                          {order.status === "shipped" && <Truck className="w-3 h-3" />}
                          {order.status === "cancelled" && <XCircle className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                            PAYMENT_STYLES[order.paymentStatus] ?? "bg-admin-chip text-admin-text-secondary"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-admin-text-subtle whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                        <br />
                        <span className="text-gray-300">
                          {new Date(order.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-chip hover:bg-gray-200 rounded-lg"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={pageHref(page - 1)}
                  aria-disabled={page <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    page <= 1
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-admin-text-subtle">
                        …
                      </span>
                    ) : (
                      <Link
                        key={p}
                        href={pageHref(p as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          page === p
                            ? "bg-gray-900 text-white"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-chip"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                <Link
                  href={pageHref(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    page >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

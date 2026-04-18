import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
} from "lucide-react";
import { OrderService } from "@/features/orders/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";
import { OrdersSearch } from "./OrdersSearch";

const PAGE_SIZE = 20;

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-admin-chip text-admin-text-secondary",
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

function buildHref(
  storeId: string,
  overrides: { q?: string; status?: string; payment?: string; page?: number }
) {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  if (overrides.status) p.set("status", overrides.status);
  if (overrides.payment) p.set("payment", overrides.payment);
  if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
  const qs = p.toString();
  return `/admin/stores/${storeId}/orders${qs ? `?${qs}` : ""}`;
}

export default async function StoreOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; status?: string; payment?: string; page?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW)) redirect("/admin");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");

  const { q, status, payment, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const { orders, total } = await OrderService.getByStore(storeId, {
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
    paymentStatus: payment || undefined,
    search: q || undefined,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Orders</h1>
          <p className="text-sm text-admin-text-muted mt-0.5">
            {total} {total === 1 ? "order" : "orders"}
          </p>
        </div>
        <Link
          href={`/admin/stores/${storeId}/orders/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Create Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row flex-wrap items-start gap-3 mb-5">

        <div className="flex flex-col gap-2 flex-1">
          {/* Order status tabs */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref(storeId, { q, payment })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!status
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
                }`}
            >
              All orders
            </Link>
            {ORDER_STATUSES.map((s) => (
              <Link
                key={s}
                href={buildHref(storeId, { q, status: s, payment })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${status === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
                  }`}
              >
                {s}
              </Link>
            ))}
          </div>

          {/* Payment status tabs */}
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref(storeId, { q, status })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!payment
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
                }`}
            >
              All payments
            </Link>
            {PAYMENT_STATUSES.map((s) => (
              <Link
                key={s}
                href={buildHref(storeId, { q, status, payment: s })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${payment === s
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
                  }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        <OrdersSearch storeId={storeId} defaultValue={q} />
      </div>

      {/* Table / Empty */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No orders found</h3>
          <p className="text-sm text-admin-text-muted">
            {q
              ? `No orders match "${q}".`
              : status || payment
                ? "Try removing some filters."
                : "Orders will appear here once placed."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-200">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Order
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Items
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Total
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Payment
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Date
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-admin-surface-raised/60 transition-colors group"
                    >
                      {/* Order number */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-admin-text-primary">
                          {order.orderNumber}
                        </span>
                        {order.notes && (
                          <span
                            className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-400"
                            title="Has notes"
                          />
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-admin-text-primary">
                          {order.shippingAddress.name}
                        </p>
                        <p className="text-xs text-admin-text-subtle mt-0.5">
                          {order.shippingAddress.phone || order.guestPhone || "—"}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="text-sm text-admin-text-secondary">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </div>
                        <div className="text-xs text-admin-text-subtle mt-0.5 max-w-40 truncate">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-admin-text-primary">
                          ৳{order.total.toLocaleString()}
                        </span>
                        {order.discount > 0 && (
                          <p className="text-xs text-green-600 mt-0.5">
                            -৳{order.discount.toLocaleString()} off
                          </p>
                        )}
                      </td>

                      {/* Order status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_STYLES[order.status] ?? "bg-admin-chip text-admin-text-secondary"
                            }`}
                        >
                          {order.status === "pending" && <Clock className="w-3 h-3" />}
                          {order.status === "delivered" && <CheckCircle className="w-3 h-3" />}
                          {order.status === "shipped" && <Truck className="w-3 h-3" />}
                          {order.status === "cancelled" && <XCircle className="w-3 h-3" />}
                          {order.status}
                        </span>
                      </td>

                      {/* Payment status */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PAYMENT_STYLES[order.paymentStatus] ?? "bg-admin-chip text-admin-text-secondary"
                            }`}
                        >
                          {order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                          <p className="text-xs text-admin-text-subtle mt-0.5 capitalize">
                            {order.paymentMethod}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-admin-text-subtle whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <br />
                        <span className="text-gray-300">
                          {new Date(order.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/stores/${storeId}/orders/${order._id}`}
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
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, status, payment, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`e-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-admin-text-subtle"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, status, payment, page: item as number })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${currentPage === item
                            ? "bg-gray-900 text-white"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-chip"
                          }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(storeId, { q, status, payment, page: currentPage + 1 })}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${currentPage >= totalPages
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

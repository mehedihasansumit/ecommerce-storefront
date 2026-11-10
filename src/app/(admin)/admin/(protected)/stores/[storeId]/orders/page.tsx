import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Plus,
  StickyNote,
} from "lucide-react";
import { Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../_components/AdminBreadcrumbs";
import { OrderService } from "@/features/orders/service";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";
import { OrdersSearch } from "./OrdersSearch";

const PAGE_SIZE = 20;

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  refunded: "bg-admin-chip text-admin-text-secondary",
};

const ORDER_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const PILL_BASE =
  "px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors focus-ring";
const PILL_ACTIVE =
  "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100";
const PILL_IDLE =
  "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:bg-admin-surface-hover";

function pillClass(active: boolean) {
  return `${PILL_BASE} ${active ? PILL_ACTIVE : PILL_IDLE}`;
}

const TH = "text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";
const PAGE_BTN =
  "w-10 h-10 flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus-ring";

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

  const [{ orders, total }, store] = await Promise.all([
    OrderService.getByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      status: status || undefined,
      paymentStatus: payment || undefined,
      search: q || undefined,
    }),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total} ${total === 1 ? "order" : "orders"}`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Orders" },
            ]}
          />
        }
        actions={
          <Link
            href={`/admin/stores/${storeId}/orders/new`}
            className={buttonClassName({ variant: "primary", size: "md" })}
          >
            <Plus size={16} aria-hidden />
            Create Order
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row flex-wrap items-start gap-3 mb-5">

        <div className="flex flex-col gap-2 flex-1">
          {/* Order status tabs */}
          <div role="group" aria-label="Filter by order status" className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref(storeId, { q, payment })}
              aria-current={(!status) ? "page" : undefined}
                className={pillClass(!status)}
            >
              All orders
            </Link>
            {ORDER_STATUSES.map((s) => (
              <Link
                key={s}
                href={buildHref(storeId, { q, status: s, payment })}
                aria-current={(status === s) ? "page" : undefined}
                className={pillClass(status === s)}
              >
                {s}
              </Link>
            ))}
          </div>

          {/* Payment status tabs */}
          <div role="group" aria-label="Filter by payment status" className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref(storeId, { q, status })}
              aria-current={(!payment) ? "page" : undefined}
                className={pillClass(!payment)}
            >
              All payments
            </Link>
            {PAYMENT_STATUSES.map((s) => (
              <Link
                key={s}
                href={buildHref(storeId, { q, status, payment: s })}
                aria-current={(payment === s) ? "page" : undefined}
                className={pillClass(payment === s)}
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
        <Card padding="none">
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description={
              q
                ? `No orders match "${q}".`
                : status || payment
                  ? "Try removing some filters."
                  : "Orders will appear here once placed."
            }
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-200">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th scope="col" className={TH}>
                      Order
                    </th>
                    <th scope="col" className={TH}>
                      Customer
                    </th>
                    <th scope="col" className={TH}>
                      Items
                    </th>
                    <th scope="col" className={TH}>
                      Total
                    </th>
                    <th scope="col" className={TH}>
                      Status
                    </th>
                    <th scope="col" className={TH}>
                      Payment
                    </th>
                    <th scope="col" className={TH}>
                      Date
                    </th>
                    <th scope="col" className={TH}>
                      Action
                    </th>
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
                            className="ml-2 inline-flex align-middle text-amber-600 dark:text-amber-400"
                            title="Has notes"
                          >
                            <StickyNote className="w-3.5 h-3.5" aria-hidden />
                            <span className="sr-only">Has notes</span>
                          </span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-admin-text-primary">
                          {order.shippingAddress.name}
                        </p>
                        <p className="text-xs text-admin-text-muted mt-0.5">
                          {order.shippingAddress.phone || order.guestPhone || "—"}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-4">
                        <div className="text-sm text-admin-text-secondary">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "items"}
                        </div>
                        <div className="text-xs text-admin-text-muted mt-0.5 max-w-40 truncate">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-admin-text-primary">
                          ৳{order.total.toLocaleString()}
                        </span>
                        {order.discount > 0 && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
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
                          {order.status === "pending" && <Clock className="w-3 h-3" aria-hidden />}
                          {order.status === "delivered" && <CheckCircle className="w-3 h-3" aria-hidden />}
                          {order.status === "shipped" && <Truck className="w-3 h-3" aria-hidden />}
                          {order.status === "cancelled" && <XCircle className="w-3 h-3" aria-hidden />}
                          {order.status}
                        </span>
                      </td>

                      {/* Payment status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${PAYMENT_STYLES[order.paymentStatus] ?? "bg-admin-chip text-admin-text-secondary"
                            }`}
                        >
                          {order.paymentStatus}
                        </span>
                        {order.paymentMethod && (
                          <p className="text-xs text-admin-text-muted mt-0.5 capitalize">
                            {order.paymentMethod}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <br />
                        <span>
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
                          className={buttonClassName({ variant: "secondary", size: "sm" })}
                          aria-label={`View order ${order.orderNumber}`}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, status, payment, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  aria-label="Previous page"
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${currentPage <= 1
                    ? "opacity-30 pointer-events-none border-admin-border-md"
                    : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden />
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
                        aria-hidden
                        className="w-10 h-10 flex items-center justify-center text-xs text-admin-text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, status, payment, page: item as number })}
                        aria-current={currentPage === item ? "page" : undefined}
                        aria-label={`Page ${item}`}
                        className={`${PAGE_BTN} ${currentPage === item
                          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
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
                  aria-label="Next page"
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${currentPage >= totalPages
                    ? "opacity-30 pointer-events-none border-admin-border-md"
                    : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronRight className="w-4 h-4" aria-hidden />
                </Link>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

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
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";
import { OrderRepository } from "@/features/orders/repository";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import { FilterChip } from "@/shared/components/admin/FilterChip";
import type { OrderStatus } from "@/features/orders/types";

export const metadata: Metadata = { title: "All Orders" };

const LIMIT = 10;

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const PAYMENT_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  refunded: "bg-admin-chip text-admin-text-secondary",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; storeId?: string; offset?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW)) redirect("/admin");

  const { status, storeId: filterStore, offset: offsetParam } = await searchParams;
  const offset = Math.max(0, parseInt(offsetParam ?? "0") || 0);

  const [{ orders, total }, stores] = await Promise.all([
    OrderRepository.findAll({
      offset,
      limit: LIMIT,
      status: status || undefined,
      storeId: filterStore || undefined,
    }),
    StoreService.getAll(),
  ]);

  const storeMap = Object.fromEntries(stores.map((s) => [s._id, s.name]));
  const prevOffset = Math.max(0, offset - LIMIT);
  const nextOffset = offset + LIMIT;
  const hasPrev = offset > 0;
  const hasNext = nextOffset < total;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = Math.min(offset + LIMIT, total);

  function href(params: Record<string, string | undefined>) {
    const merged: Record<string, string | undefined> = {
      status,
      storeId: filterStore,
      offset: undefined,
      ...params,
    };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  }

  function offsetHref(o: number) {
    return href({ offset: o > 0 ? String(o) : undefined, status, storeId: filterStore });
  }

  const thClass = "text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";
  const viewClass = buttonClassName({ variant: "secondary", size: "sm", className: "min-h-10 sm:min-h-0" });
  const formatDay = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader
        title="All Orders"
        description={`${total} ${total === 1 ? "order" : "orders"} across all stores`}
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "All Orders" }]} />
        }
      />

      <div className="space-y-3 mb-6">
        {/* Status filter */}
        <div role="group" aria-label="Filter by status" className="flex gap-1.5 flex-wrap">
          <FilterChip href={href({ status: undefined })} selected={!status}>
            All Status
          </FilterChip>
          {ALL_STATUSES.map((s) => (
            <FilterChip key={s} href={href({ status: s })} selected={status === s} className="capitalize">
              {s}
            </FilterChip>
          ))}
        </div>

        {/* Store filter */}
        {stores.length > 1 && (
          <div role="group" aria-label="Filter by store" className="flex gap-1.5 flex-wrap">
            <FilterChip href={href({ storeId: undefined })} selected={!filterStore}>
              All Stores
            </FilterChip>
            {stores.map((s) => (
              <FilterChip key={s._id} href={href({ storeId: s._id })} selected={filterStore === s._id}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description={status || filterStore ? "Try removing some filters." : "Orders will appear here once placed."}
          />
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {orders.map((order) => (
              <li key={order._id}>
                <Card padding="md" className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold text-admin-text-primary">{order.orderNumber}</p>
                      <p className="text-xs text-admin-text-muted mt-0.5">{storeMap[order.storeId] ?? "—"}</p>
                    </div>
                    <OrderStatusPill status={order.status} />
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-admin-text-primary truncate">{order.shippingAddress.name}</p>
                      <p className="text-xs text-admin-text-muted">{order.shippingAddress.phone || "—"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-admin-text-primary">৳{order.total.toLocaleString()}</p>
                      <p className="text-xs text-admin-text-muted">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-admin-border">
                    <PaymentPill status={order.paymentStatus} />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-admin-text-muted">{formatDay(order.createdAt)}</span>
                      <Link
                        href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                        aria-label={`View order ${order.orderNumber}`}
                        className={viewClass}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <Card padding="none" className="hidden sm:block overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-200">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th scope="col" className={thClass}>Order</th>
                    <th scope="col" className={thClass}>Store</th>
                    <th scope="col" className={thClass}>Customer</th>
                    <th scope="col" className={thClass}>Items</th>
                    <th scope="col" className={thClass}>Total</th>
                    <th scope="col" className={thClass}>Status</th>
                    <th scope="col" className={thClass}>Payment</th>
                    <th scope="col" className={thClass}>Date</th>
                    <th scope="col" className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-admin-surface-hover transition-colors">
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
                        <p className="text-xs text-admin-text-muted mt-0.5">{order.shippingAddress.phone || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-admin-text-secondary">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        </div>
                        <div className="text-xs text-admin-text-muted mt-0.5 max-w-40 truncate">
                          {order.items.map((i) => i.productName).join(", ")}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-admin-text-primary">
                          ৳{order.total.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusPill status={order.status} />
                      </td>
                      <td className="px-5 py-4">
                        <PaymentPill status={order.paymentStatus} />
                      </td>
                      <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
                        {formatDay(order.createdAt)}
                        <br />
                        <span>
                          {new Date(order.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                          aria-label={`View order ${order.orderNumber}`}
                          className={viewClass}
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
          {(hasPrev || hasNext) && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {rangeStart}–{rangeEnd} of {total}
              </p>
              <div className="flex items-center gap-1">
                <PageArrow href={offsetHref(prevOffset)} disabled={!hasPrev} label="Previous page">
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </PageArrow>
                <PageArrow href={offsetHref(nextOffset)} disabled={!hasNext} label="Next page">
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </PageArrow>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

const STATUS_ICONS: Partial<Record<OrderStatus, LucideIcon>> = {
  pending: Clock,
  delivered: CheckCircle,
  shipped: Truck,
  cancelled: XCircle,
};

/** Status text is always shown, so colour is never the only signal. */
function OrderStatusPill({ status }: { status: OrderStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${
        STATUS_STYLES[status] ?? "bg-admin-chip text-admin-text-secondary"
      }`}
    >
      {Icon && <Icon aria-hidden className="w-3 h-3" />}
      {status}
    </span>
  );
}

function PaymentPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
        PAYMENT_STYLES[status] ?? "bg-admin-chip text-admin-text-secondary"
      }`}
    >
      <span className="sr-only">Payment: </span>
      {status}
    </span>
  );
}

function PageArrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={`w-10 h-10 flex items-center justify-center rounded-lg border border-admin-border-md text-admin-text-muted transition-colors focus-ring ${
        disabled ? "opacity-30 pointer-events-none" : "hover:bg-admin-surface-hover"
      }`}
    >
      {children}
    </Link>
  );
}

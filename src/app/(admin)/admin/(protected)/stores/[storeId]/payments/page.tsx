import { redirect, notFound } from "next/navigation";
import { OrderService } from "@/features/orders/service";
import { StoreService } from "@/features/stores/service";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentsSearch } from "./PaymentsSearch";
import { CreditCard, ChevronLeft, ChevronRight, TrendingUp, Clock, XCircle, RotateCcw } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { Metadata } from "next";
import type { PaymentStatus } from "@/features/orders/types";
import Link from "next/link";
import { Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";

export const metadata: Metadata = { title: "Payments" };

const PAGE_SIZE = 20;

const PAYMENT_FILTER_STYLES: Record<PaymentStatus | "all", string> = {
  all:      "bg-admin-text-primary text-admin-surface border-admin-text-primary",
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900",
  paid:     "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900",
  failed:   "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  refunded: "bg-admin-chip text-admin-text-primary border-admin-text-subtle",
};

const PILL =
  "focus-ring px-3 py-1.5 rounded-full text-xs font-medium border transition-colors";
const PILL_IDLE =
  "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-admin-text-subtle";
const PAGE_BTN =
  "focus-ring w-10 h-10 flex items-center justify-center rounded-lg transition-colors";

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !hasPermission(adminUser, PERMISSIONS.PAYMENTS_VIEW)) redirect("/admin");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");

  const { page: pageStr, status, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [{ orders, total }, stats, store] = await Promise.all([
    OrderService.getByStore(storeId, {
      paymentStatus: status || undefined,
      search: q || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    OrderService.getPaymentStats(storeId),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paymentStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

  function buildHref(p: number, s?: string, query?: string) {
    const sp = new URLSearchParams();
    if (p > 1) sp.set("page", String(p));
    if (s) sp.set("status", s);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    return `?${qs}`;
  }

  const statCards = [
    { icon: TrendingUp, iconClass: "text-green-500", label: "Revenue", value: `৳${stats.totalRevenue.toLocaleString()}`, hint: `${stats.paid} paid orders` },
    { icon: Clock, iconClass: "text-yellow-500", label: "Pending", value: stats.pending, hint: "awaiting payment" },
    { icon: XCircle, iconClass: "text-red-500", label: "Failed", value: stats.failed, hint: "failed transactions" },
    { icon: RotateCcw, iconClass: "text-admin-text-muted", label: "Refunded", value: stats.refunded, hint: "orders refunded" },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description={`${total} orders`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Payments" },
            ]}
          />
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ icon: Icon, iconClass, label, value, hint }) => (
          <Card key={label} padding="md">
            <div className="flex items-center gap-2 mb-1">
              <Icon aria-hidden className={`w-4 h-4 ${iconClass}`} />
              <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-xl font-bold text-admin-text-primary">{value}</p>
            <p className="text-xs text-admin-text-muted mt-0.5">{hint}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <PaymentsSearch storeId={storeId} defaultValue={q} />

        <div className="flex flex-wrap gap-1.5 ml-auto" role="group" aria-label="Filter by payment status">
          <Link
            href={buildHref(1, undefined, q)}
            aria-current={!status ? "page" : undefined}
            className={`${PILL} ${!status ? PAYMENT_FILTER_STYLES.all : PILL_IDLE}`}
          >
            All
          </Link>
          {paymentStatuses.map((s) => (
            <Link
              key={s}
              href={buildHref(1, s, q)}
              aria-current={status === s ? "page" : undefined}
              className={`${PILL} capitalize ${status === s ? PAYMENT_FILTER_STYLES[s] : PILL_IDLE}`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={CreditCard}
            title="No orders found"
            description={
              q
                ? `No orders match "${q}".`
                : status
                ? `No orders with payment status "${status}".`
                : "No orders yet."
            }
          />
        </Card>
      ) : (
        <>
          <PaymentsTable orders={orders} storeId={storeId} />

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={buildHref(Math.max(1, currentPage - 1), status, q)}
                  aria-label="Previous page"
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span key={`e-${idx}`} aria-hidden className="w-10 h-10 flex items-center justify-center text-xs text-admin-text-muted">…</span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(item as number, status, q)}
                        aria-label={`Page ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                        className={`${PAGE_BTN} text-xs font-medium ${
                          currentPage === item
                            ? "bg-admin-text-primary text-admin-surface"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-chip"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(Math.min(totalPages, currentPage + 1), status, q)}
                  aria-label="Next page"
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

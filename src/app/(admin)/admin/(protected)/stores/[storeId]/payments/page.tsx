import { redirect } from "next/navigation";
import { OrderService } from "@/features/orders/service";
import { PaymentsTable } from "./PaymentsTable";
import { PaymentsSearch } from "./PaymentsSearch";
import { CreditCard, ChevronLeft, ChevronRight, TrendingUp, Clock, XCircle, RotateCcw } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { Metadata } from "next";
import type { PaymentStatus } from "@/features/orders/types";
import Link from "next/link";

export const metadata: Metadata = { title: "Payments" };

const PAGE_SIZE = 20;

const PAYMENT_FILTER_STYLES: Record<PaymentStatus | "all", string> = {
  all:      "bg-gray-900 text-white border-gray-900",
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:     "bg-green-100 text-green-800 border-green-200",
  failed:   "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-admin-chip text-admin-text-secondary border-admin-border",
};

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

  const [{ orders, total }, stats] = await Promise.all([
    OrderService.getByStore(storeId, {
      paymentStatus: status || undefined,
      search: q || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    OrderService.getPaymentStats(storeId),
  ]);

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-admin-text-subtle" />
            Payments
          </h1>
          <p className="text-sm text-admin-text-muted mt-0.5">{total} orders</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-admin-surface rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">Revenue</span>
          </div>
          <p className="text-xl font-bold text-gray-900">৳{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-admin-text-subtle mt-0.5">{stats.paid} paid orders</p>
        </div>

        <div className="bg-admin-surface rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
          <p className="text-xs text-admin-text-subtle mt-0.5">awaiting payment</p>
        </div>

        <div className="bg-admin-surface rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">Failed</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.failed}</p>
          <p className="text-xs text-admin-text-subtle mt-0.5">failed transactions</p>
        </div>

        <div className="bg-admin-surface rounded-xl border border-admin-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="w-4 h-4 text-admin-text-muted" />
            <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">Refunded</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.refunded}</p>
          <p className="text-xs text-admin-text-subtle mt-0.5">orders refunded</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <PaymentsSearch storeId={storeId} defaultValue={q} />

        <div className="flex flex-wrap gap-1.5 ml-auto">
          <Link
            href={buildHref(1, undefined, q)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !status
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-admin-surface text-admin-text-secondary border-admin-border hover:border-gray-400"
            }`}
          >
            All
          </Link>
          {paymentStatuses.map((s) => (
            <Link
              key={s}
              href={buildHref(1, s, q)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                status === s
                  ? PAYMENT_FILTER_STYLES[s]
                  : "bg-admin-surface text-admin-text-secondary border-admin-border hover:border-gray-400"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
          <p className="text-sm text-admin-text-muted">
            {q
              ? `No orders match "${q}".`
              : status
              ? `No orders with payment status "${status}".`
              : "No orders yet."}
          </p>
        </div>
      ) : (
        <>
          <PaymentsTable orders={orders} storeId={storeId} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(Math.max(1, currentPage - 1), status, q)}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
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
                      <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-admin-text-subtle">…</span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(item as number, status, q)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === item
                            ? "bg-gray-900 text-white"
                            : "border border-admin-border text-admin-text-secondary hover:bg-admin-chip"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(Math.min(totalPages, currentPage + 1), status, q)}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border hover:bg-admin-chip"
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

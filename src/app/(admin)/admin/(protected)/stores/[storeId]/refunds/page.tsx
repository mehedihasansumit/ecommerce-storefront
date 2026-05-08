import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ArrowLeft, ExternalLink } from "lucide-react";
import { OrderService } from "@/features/orders/service";
import type { RefundRequestStatus } from "@/features/orders/types";

const STATUS_TABS: { label: string; value: RefundRequestStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Processed", value: "processed" },
];

const STATUS_STYLES: Record<RefundRequestStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  processed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function RefundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const status = (sp.status as RefundRequestStatus | undefined) ?? undefined;
  const page = Number(sp.page ?? "1");

  const { orders, total } = await OrderService.getRefundQueue(storeId, {
    status,
    page,
    limit: 20,
  });

  if (!orders && total === undefined) notFound();

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/admin/stores/${storeId}`}
          className="inline-flex items-center gap-1.5 text-sm text-admin-text-muted hover:text-admin-text-secondary transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Store
        </Link>
        <div className="flex items-center gap-3">
          <RotateCcw className="w-5 h-5 text-admin-text-subtle" />
          <h1 className="text-2xl font-bold tracking-tight text-admin-text-primary">
            Refund Requests
          </h1>
          <span className="text-sm text-admin-text-muted">({total})</span>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (status ?? "all") === tab.value;
          const href =
            tab.value === "all"
              ? `/admin/stores/${storeId}/refunds`
              : `/admin/stores/${storeId}/refunds?status=${tab.value}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-admin-text-primary text-admin-surface"
                  : "bg-admin-chip text-admin-text-secondary hover:bg-admin-chip-hover"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-admin-surface rounded-xl border border-admin-border overflow-hidden">
        {orders.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <RotateCcw className="w-8 h-8 text-admin-text-subtle mx-auto mb-3" />
            <p className="text-sm text-admin-text-muted">No refund requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-raised text-admin-text-muted text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Order</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Requested</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-admin-text-secondary text-xs">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-admin-text-secondary">
                      {order.shippingAddress.name}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-admin-text-primary">
                      ৳{order.refundRequest!.refundAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-admin-text-muted max-w-[200px] truncate">
                      {order.refundRequest!.reason}
                    </td>
                    <td className="px-4 py-3 text-admin-text-muted whitespace-nowrap">
                      {new Date(order.refundRequest!.requestedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          STATUS_STYLES[order.refundRequest!.status]
                        }`}
                      >
                        {order.refundRequest!.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/stores/${storeId}/orders/${order._id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-admin-text-muted">
          <span>
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/stores/${storeId}/refunds?${status ? `status=${status}&` : ""}page=${page - 1}`}
                className="px-3 py-1.5 rounded-lg bg-admin-chip text-admin-text-secondary hover:bg-admin-chip-hover transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/stores/${storeId}/refunds?${status ? `status=${status}&` : ""}page=${page + 1}`}
                className="px-3 py-1.5 rounded-lg bg-admin-chip text-admin-text-secondary hover:bg-admin-chip-hover transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

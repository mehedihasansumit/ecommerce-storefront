import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { OrderRepository } from "@/features/orders/repository";
import { StoreService } from "@/features/stores/service";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";
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
  refunded: "bg-gray-100 text-gray-800",
};

const ALL_STATUSES: OrderStatus[] = [
  "pending","confirmed","processing","shipped","delivered","cancelled",
];

export default async function AllOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; storeId?: string; page?: string }>;
}) {
  const payload = (await getAdminToken()) as JwtAdminPayload | null;
  if (!payload || !hasPermission(payload, PERMISSIONS.ORDERS_VIEW)) redirect("/admin");

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
      page: undefined,   // reset to page 1 on filter change
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
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">All Orders</h1>
        <div className="flex gap-3 text-sm">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-center">
            <p className="text-gray-500 text-xs">Total</p>
            <p className="font-bold">{total}</p>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        <Link href={href({ status: undefined })}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!status ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
          All Status
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link key={s} href={href({ status: s })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${status === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {s}
          </Link>
        ))}
      </div>

      {/* Store filter */}
      {stores.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
          <Link href={href({ storeId: undefined })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!filterStore ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            All Stores
          </Link>
          {stores.map((s) => (
            <Link key={s._id} href={href({ storeId: s._id })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterStore === s._id ? "bg-gray-700 text-white border-gray-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
              {s.name}
            </Link>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-lg border border-gray-200">
          No orders found.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {["Order","Store","Customer","Items","Total","Status","Payment","Date",""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {storeMap[order.storeId] ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{order.shippingAddress.name}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        ৳{order.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${PAYMENT_STYLES[order.paymentStatus] ?? "bg-gray-100 text-gray-700"}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/stores/${order.storeId}/orders/${order._id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                          View →
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
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={pageHref(page - 1)}
                  aria-disabled={page <= 1}
                  className={`p-2 rounded-lg border text-sm transition-colors ${page <= 1 ? "border-gray-100 text-gray-300 pointer-events-none" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <ChevronLeft size={16} />
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
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={pageHref(p as number)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors ${page === p ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                      >
                        {p}
                      </Link>
                    )
                  )}

                <Link
                  href={pageHref(page + 1)}
                  aria-disabled={page >= totalPages}
                  className={`p-2 rounded-lg border text-sm transition-colors ${page >= totalPages ? "border-gray-100 text-gray-300 pointer-events-none" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

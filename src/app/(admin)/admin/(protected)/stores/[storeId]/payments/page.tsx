import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderRepository } from "@/features/orders/repository";
import { StoreService } from "@/features/stores/service";
import { PaymentsTable } from "./PaymentsTable";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { PaymentStatus } from "@/features/orders/types";

export const metadata: Metadata = { title: "Payments" };

const PAGE_SIZE = 20;

const PAYMENT_FILTER_STYLES: Record<PaymentStatus | "all", string> = {
  all:      "bg-gray-900 text-white border-gray-900",
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:     "bg-green-100 text-green-800 border-green-200",
  failed:   "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
};

export default async function PaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { storeId } = await params;
  const { page: pageStr, status } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const store = await StoreService.getById(storeId);
  if (!store) notFound();

  const { orders, total } = await OrderRepository.findAll({
    storeId,
    paymentStatus: status || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paymentStatuses: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

  function buildHref(p: number, s?: string) {
    const sp = new URLSearchParams();
    sp.set("page", String(p));
    if (s) sp.set("status", s);
    return `?${sp.toString()}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/admin/stores/${storeId}`}
            className="text-sm text-gray-500 hover:text-gray-800 mb-1 inline-block"
          >
            ← {store.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-gray-400" />
            Payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">{total} orders</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Link
          href={buildHref(1)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All
        </Link>
        {paymentStatuses.map((s) => (
          <Link
            key={s}
            href={buildHref(1, s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
              status === s
                ? PAYMENT_FILTER_STYLES[s]
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No orders found</h3>
          <p className="text-sm text-gray-500">
            {status ? `No orders with payment status "${status}".` : "No orders yet."}
          </p>
        </div>
      ) : (
        <>
          <PaymentsTable orders={orders} storeId={storeId} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(Math.max(1, currentPage - 1), status)}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-500 transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-gray-200"
                      : "border-gray-200 hover:bg-gray-100"
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
                      <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">…</span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(item as number, status)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === item
                            ? "bg-gray-900 text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(Math.min(totalPages, currentPage + 1), status)}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-500 transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-gray-200"
                      : "border-gray-200 hover:bg-gray-100"
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

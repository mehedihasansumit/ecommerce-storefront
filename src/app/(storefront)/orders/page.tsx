import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { getStoreId } from "@/shared/lib/tenant";
import { OrderService } from "@/features/orders/service";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("myOrders") };
}

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const t = await getTranslations("orders");
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    redirect("/account/login");
  }

  const customerPayload = payload as JwtCustomerPayload;
  const storeId = await getStoreId();
  if (!storeId) redirect("/");

  const user = await AuthRepository.findUserById(customerPayload.userId);
  if (!user || !user.phone) redirect("/account");

  const { orders, total } = await OrderService.getByPhonePaginated(storeId, user.phone, {
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("myOrders")}</h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-1">{total} orders total</p>
          )}
        </div>
        <Link
          href="/account"
          className="text-sm"
          style={{ color: "var(--color-primary)" }}
        >
          ← My Account
        </Link>
      </div>

      {total === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t("noOrders")}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2 text-white font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-6 bg-white hover:shadow-[var(--shadow-sm)] transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {t("orderNumber")}
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t("date")}:{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("items", { count: order.items.length })}
                    </p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-md ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="font-semibold">
                      ৳{order.total.toLocaleString()}
                    </p>
                    <Link
                      href={`/orders/${order._id}`}
                      className="text-sm font-medium"
                      style={{ color: "var(--color-primary)" }}
                    >
                      {t("viewOrder")} →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={`?page=${Math.max(1, currentPage - 1)}`}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-gray-200 text-gray-400"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
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
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={`?page=${item}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium border transition-colors ${
                          currentPage === item
                            ? "border-transparent text-white"
                            : "border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                        style={
                          currentPage === item
                            ? { backgroundColor: "var(--color-primary)" }
                            : {}
                        }
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={`?page=${Math.min(totalPages, currentPage + 1)}`}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-gray-200 text-gray-400"
                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
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

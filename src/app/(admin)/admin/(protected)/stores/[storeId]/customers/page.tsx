import Link from "next/link";
import type { Metadata } from "next";
import { Users, Mail, Phone, MapPin, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthService } from "@/features/auth/service";
import { OrderService } from "@/features/orders/service";
import { CustomersSearch } from "./CustomersSearch";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 15;

type Status = "all" | "active" | "inactive";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function buildHref(
  storeId: string,
  overrides: { q?: string; status?: string; page?: number }
) {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  if (overrides.status && overrides.status !== "all") p.set("status", overrides.status);
  if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
  const qs = p.toString();
  return `/admin/stores/${storeId}/customers${qs ? `?${qs}` : ""}`;
}

export default async function StoreCustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { storeId } = await params;
  const { q, status: rawStatus, page: pageStr } = await searchParams;

  const status: Status =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [{ customers, total }, orderStats] = await Promise.all([
    AuthService.getCustomersByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      search: q || undefined,
      status,
    }),
    OrderService.getCustomerOrderStats(storeId),
  ]);

  const statsMap = new Map(orderStats.map((s) => [s.userId, s]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "customer" : "customers"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <CustomersSearch storeId={storeId} defaultValue={q} />

        <div className="flex items-center gap-1 ml-auto">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <Link
              key={s}
              href={buildHref(storeId, { q, status: s })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                status === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No customers found</h3>
          <p className="text-sm text-gray-500">
            {q
              ? `No customers match "${q}".`
              : status !== "all"
              ? `No ${status} customers yet.`
              : "Customers will appear here once they register."}
          </p>
        </div>
      ) : (
        <>
          {/* Pagination info */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, status, page: currentPage - 1 })}
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
                        className="w-8 h-8 flex items-center justify-center text-xs text-gray-400"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, status, page: item as number })}
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
                  href={buildHref(storeId, { q, status, page: currentPage + 1 })}
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

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Orders
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Spent
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Joined
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => {
                    const stats = statsMap.get(customer._id);
                    const defaultAddress =
                      customer.addresses?.find((a) => a.isDefault) ??
                      customer.addresses?.[0];

                    return (
                      <tr
                        key={customer._id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(customer.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 shrink-0 text-gray-400" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <Phone className="w-3 h-3 shrink-0 text-gray-400" />
                                {customer.phone}
                              </p>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          {defaultAddress ? (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              {[defaultAddress.city, defaultAddress.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        {/* Orders */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {stats?.orderCount ?? 0}
                            </span>
                          </div>
                          {stats?.lastOrderAt && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Last:{" "}
                              {new Date(stats.lastOrderAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                          )}
                        </td>

                        {/* Total spent */}
                        <td className="px-5 py-4">
                          {stats ? (
                            <span className="text-sm font-semibold text-gray-900">
                              ৳{stats.totalSpent.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              customer.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                customer.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            {customer.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          {(stats?.orderCount ?? 0) > 0 && (
                            <Link
                              href={`/admin/stores/${storeId}/orders?q=${encodeURIComponent(customer.phone || customer.email || customer.name)}`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
                            >
                              Orders
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

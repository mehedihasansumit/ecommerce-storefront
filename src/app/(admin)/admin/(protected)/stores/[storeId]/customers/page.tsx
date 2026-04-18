import Link from "next/link";
import type { Metadata } from "next";
import { Users, Mail, Phone, MapPin, ShoppingBag, ChevronLeft, ChevronRight, Coins } from "lucide-react";
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
          <h1 className="text-2xl font-bold text-admin-text-primary">Customers</h1>
          <p className="text-sm text-admin-text-muted mt-0.5">
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
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No customers found</h3>
          <p className="text-sm text-admin-text-muted">
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
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, status, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage <= 1
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
                        href={buildHref(storeId, { q, status, page: item as number })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === item
                            ? "bg-gray-900 text-white"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-chip"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(storeId, { q, status, page: currentPage + 1 })}
                  aria-disabled={currentPage >= totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          <div className="bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead>
                  <tr className="border-b border-admin-border-md bg-admin-surface-raised">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Location
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Orders
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Spent
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Points
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Joined
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {customers.map((customer) => {
                    const stats = statsMap.get(customer._id);
                    const defaultAddress =
                      customer.addresses?.find((a) => a.isDefault) ??
                      customer.addresses?.[0];

                    return (
                      <tr
                        key={customer._id}
                        className="hover:bg-admin-surface-raised/60 transition-colors group"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(customer.name)}
                            </div>
                            <span className="text-sm font-medium text-admin-text-primary">
                              {customer.name}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                                <Mail className="w-3 h-3 shrink-0 text-admin-text-subtle" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                                <Phone className="w-3 h-3 shrink-0 text-admin-text-subtle" />
                                {customer.phone}
                              </p>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-admin-text-subtle">—</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          {defaultAddress ? (
                            <span className="text-xs text-admin-text-muted flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-admin-text-subtle shrink-0" />
                              {[defaultAddress.city, defaultAddress.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-admin-text-subtle">—</span>
                          )}
                        </td>

                        {/* Orders */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="w-3.5 h-3.5 text-admin-text-subtle" />
                            <span className="text-sm font-medium text-admin-text-primary">
                              {stats?.orderCount ?? 0}
                            </span>
                          </div>
                          {stats?.lastOrderAt && (
                            <p className="text-[10px] text-admin-text-subtle mt-0.5">
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
                            <span className="text-sm font-semibold text-admin-text-primary">
                              ৳{stats.totalSpent.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-sm text-admin-text-subtle">—</span>
                          )}
                        </td>

                        {/* Points */}
                        <td className="px-5 py-4">
                          {(customer.points ?? 0) > 0 ? (
                            <Link
                              href={`/admin/stores/${storeId}/points/${customer._id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-admin-text-primary hover:text-amber-600 transition-colors"
                            >
                              <Coins className="w-3.5 h-3.5 text-amber-500" />
                              {(customer.points ?? 0).toLocaleString()}
                            </Link>
                          ) : (
                            <span className="text-sm text-admin-text-subtle">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              customer.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-admin-chip text-admin-text-muted"
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
                        <td className="px-5 py-4 text-xs text-admin-text-subtle whitespace-nowrap">
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
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-chip hover:bg-gray-200 rounded-lg whitespace-nowrap"
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

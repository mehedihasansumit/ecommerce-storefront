import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthService } from "@/features/auth/service";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import { Users, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Customers" };

const PAGE_SIZE = 10;

type Status = "all" | "active" | "inactive";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default async function AllCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; store?: string; status?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !hasPermission(adminUser, PERMISSIONS.CUSTOMERS_VIEW)) redirect("/admin");

  const { page: pageStr, store: storeFilter, status: rawStatus } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const status: Status =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";

  const [{ customers, total }, stores] = await Promise.all([
    AuthService.getAllCustomers({
      page,
      limit: PAGE_SIZE,
      storeId: storeFilter,
      status: status === "all" ? undefined : status,
    }),
    StoreService.getAll(),
  ]);

  const storeMap = new Map(stores.map((s) => [s._id, s]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  function buildHref(overrides: { page?: number; store?: string; status?: string }) {
    const sp = new URLSearchParams();
    const p = overrides.page ?? 1;
    if (p > 1) sp.set("page", String(p));
    const s = "store" in overrides ? overrides.store : storeFilter;
    if (s) sp.set("store", s);
    const st = "status" in overrides ? overrides.status : rawStatus;
    if (st && st !== "all") sp.set("status", st);
    const qs = sp.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Customers</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {total} {total === 1 ? "customer" : "customers"}
            {storeFilter ? " in this store" : " across all stores"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        {/* Store filter */}
        {stores.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={buildHref({ store: undefined, page: 1 })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                !storeFilter
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
              }`}
            >
              All Stores
            </Link>
            {stores.map((s) => (
              <Link
                key={s._id}
                href={buildHref({ store: s._id, page: 1 })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  storeFilter === s._id
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex items-center gap-1 ml-auto">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s, page: 1 })}
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

      {/* Empty state */}
      {total === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No customers found</h3>
          <p className="text-sm text-admin-text-muted">
            {storeFilter || status !== "all"
              ? "Try removing some filters."
              : "Customers will appear here once they register."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {customers.map((customer) => {
              const store = storeMap.get(customer.storeId);
              const defaultAddress =
                customer.addresses?.find((a) => a.isDefault) ?? customer.addresses?.[0];

              return (
                <div key={customer._id} className="bg-admin-surface rounded-xl border border-admin-border-md p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {getInitials(customer.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary truncate">{customer.name}</p>
                      {store && (
                        <p className="text-xs text-admin-text-subtle truncate">{store.name}</p>
                      )}
                    </div>
                    <span
                      className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                        customer.isActive ? "bg-green-100 text-green-700" : "bg-admin-chip text-admin-text-muted"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${customer.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                      {customer.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

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
                    {defaultAddress && (
                      <p className="text-xs text-admin-text-muted flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0 text-admin-text-subtle" />
                        {[defaultAddress.city, defaultAddress.country].filter(Boolean).join(", ") || "—"}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-admin-border">
                    <span className="text-xs text-admin-text-subtle">
                      Joined{" "}
                      {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                    {store && (
                      <Link
                        href={`/admin/stores/${store._id}/customers`}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                      >
                        View in Store
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
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
                    {!storeFilter && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                        Store
                      </th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Location
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
                    const store = storeMap.get(customer.storeId);
                    const defaultAddress =
                      customer.addresses?.find((a) => a.isDefault) ?? customer.addresses?.[0];

                    return (
                      <tr key={customer._id} className="hover:bg-admin-surface-raised/60 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {getInitials(customer.name)}
                            </div>
                            <span className="text-sm font-medium text-admin-text-primary">{customer.name}</span>
                          </div>
                        </td>

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

                        {!storeFilter && (
                          <td className="px-5 py-4">
                            {store ? (
                              <Link
                                href={`/admin/stores/${store._id}/customers`}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {store.name}
                              </Link>
                            ) : (
                              <span className="text-xs text-admin-text-subtle">—</span>
                            )}
                          </td>
                        )}

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

                        <td className="px-5 py-4 text-xs text-admin-text-subtle whitespace-nowrap">
                          {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>

                        <td className="px-5 py-4">
                          {store && (
                            <Link
                              href={`/admin/stores/${store._id}/customers`}
                              className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-chip hover:bg-gray-200 rounded-lg whitespace-nowrap"
                            >
                              View in Store
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref({ page: currentPage - 1 })}
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
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-8 h-8 flex items-center justify-center text-xs text-admin-text-subtle"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref({ page: item as number })}
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
                  href={buildHref({ page: currentPage + 1 })}
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
        </>
      )}
    </div>
  );
}

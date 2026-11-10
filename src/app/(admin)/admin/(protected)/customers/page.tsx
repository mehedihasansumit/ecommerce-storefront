import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthService } from "@/features/auth/service";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import { Users, Mail, Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { FilterChip } from "@/shared/components/admin/FilterChip";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";

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

  const thClass = "text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";
  const viewInStoreClass = buttonClassName({ variant: "secondary", size: "sm", className: "min-h-10 sm:min-h-0" });
  const formatJoined = (d: Date | string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total} ${total === 1 ? "customer" : "customers"}${storeFilter ? " in this store" : " across all stores"}`}
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Customers" }]} />
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-start gap-3 mb-6">
        {/* Store filter */}
        {stores.length > 1 && (
          <div role="group" aria-label="Filter by store" className="flex flex-wrap gap-1.5">
            <FilterChip href={buildHref({ store: undefined, page: 1 })} selected={!storeFilter}>
              All Stores
            </FilterChip>
            {stores.map((s) => (
              <FilterChip key={s._id} href={buildHref({ store: s._id, page: 1 })} selected={storeFilter === s._id}>
                {s.name}
              </FilterChip>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <FilterChip key={s} href={buildHref({ status: s, page: 1 })} selected={status === s} className="capitalize">
              {s}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {total === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              storeFilter || status !== "all"
                ? "Try removing some filters."
                : "Customers will appear here once they register."
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {customers.map((customer) => {
              const store = storeMap.get(customer.storeId);
              const defaultAddress =
                customer.addresses?.find((a) => a.isDefault) ?? customer.addresses?.[0];

              return (
                <li key={customer._id}>
                  <Card padding="md" className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={customer.name} className="w-10 h-10" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-admin-text-primary truncate">{customer.name}</p>
                        {store && (
                          <p className="text-xs text-admin-text-muted truncate">{store.name}</p>
                        )}
                      </div>
                      <ActiveStatus active={customer.isActive} className="ml-auto" />
                    </div>

                    <div className="space-y-1">
                      {customer.email && (
                        <p className="text-xs text-admin-text-secondary flex items-center gap-1.5 min-w-0">
                          <Mail aria-hidden className="w-3 h-3 shrink-0 text-admin-text-muted" />
                          <span className="truncate">{customer.email}</span>
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                          <Phone aria-hidden className="w-3 h-3 shrink-0 text-admin-text-muted" />
                          {customer.phone}
                        </p>
                      )}
                      {defaultAddress && (
                        <p className="text-xs text-admin-text-muted flex items-center gap-1.5">
                          <MapPin aria-hidden className="w-3 h-3 shrink-0 text-admin-text-muted" />
                          {[defaultAddress.city, defaultAddress.country].filter(Boolean).join(", ") || "—"}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-admin-border">
                      <span className="text-xs text-admin-text-muted">
                        Joined {formatJoined(customer.createdAt)}
                      </span>
                      {store && (
                        <Link
                          href={`/admin/stores/${store._id}/customers`}
                          aria-label={`View ${customer.name} in ${store.name}`}
                          className={viewInStoreClass}
                        >
                          View in Store
                        </Link>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop table */}
          <Card padding="none" className="hidden sm:block overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-175">
                <thead>
                  <tr className="border-b border-admin-border-md bg-admin-surface-raised">
                    <th scope="col" className={thClass}>Customer</th>
                    <th scope="col" className={thClass}>Contact</th>
                    {!storeFilter && <th scope="col" className={thClass}>Store</th>}
                    <th scope="col" className={thClass}>Location</th>
                    <th scope="col" className={thClass}>Status</th>
                    <th scope="col" className={thClass}>Joined</th>
                    <th scope="col" className={thClass}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {customers.map((customer) => {
                    const store = storeMap.get(customer.storeId);
                    const defaultAddress =
                      customer.addresses?.find((a) => a.isDefault) ?? customer.addresses?.[0];

                    return (
                      <tr key={customer._id} className="hover:bg-admin-surface-hover transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={customer.name} className="w-9 h-9" />
                            <span className="text-sm font-medium text-admin-text-primary">{customer.name}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {customer.email && (
                              <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                                <Mail aria-hidden className="w-3 h-3 shrink-0 text-admin-text-muted" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                                <Phone aria-hidden className="w-3 h-3 shrink-0 text-admin-text-muted" />
                                {customer.phone}
                              </p>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-admin-text-muted">—</span>
                            )}
                          </div>
                        </td>

                        {!storeFilter && (
                          <td className="px-5 py-4">
                            {store ? (
                              <Link
                                href={`/admin/stores/${store._id}/customers`}
                                className="rounded text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline transition-colors focus-ring"
                              >
                                {store.name}
                              </Link>
                            ) : (
                              <span className="text-xs text-admin-text-muted">—</span>
                            )}
                          </td>
                        )}

                        <td className="px-5 py-4">
                          {defaultAddress ? (
                            <span className="text-xs text-admin-text-muted flex items-center gap-1">
                              <MapPin aria-hidden className="w-3 h-3 text-admin-text-muted shrink-0" />
                              {[defaultAddress.city, defaultAddress.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-admin-text-muted">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <ActiveStatus active={customer.isActive} />
                        </td>

                        <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
                          {formatJoined(customer.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          {store && (
                            <Link
                              href={`/admin/stores/${store._id}/customers`}
                              aria-label={`View ${customer.name} in ${store.name}`}
                              className={viewInStoreClass}
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
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <PageArrow
                  href={buildHref({ page: currentPage - 1 })}
                  disabled={currentPage <= 1}
                  label="Previous page"
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </PageArrow>

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
                        aria-hidden
                        className="w-10 h-10 flex items-center justify-center text-xs text-admin-text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref({ page: item as number })}
                        aria-label={`Page ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus-ring ${
                          currentPage === item
                            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-surface-hover"
                        }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <PageArrow
                  href={buildHref({ page: currentPage + 1 })}
                  disabled={currentPage >= totalPages}
                  label="Next page"
                >
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

function InitialsAvatar({ name, className }: { name: string; className: string }) {
  return (
    <div
      aria-hidden
      className={`${className} rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-xs font-bold shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

/** Dot + text label, so status never relies on colour alone. */
function ActiveStatus({ active, className }: { active: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
          : "bg-admin-chip text-admin-chip-text"
      } ${className ?? ""}`}
    >
      <span aria-hidden className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-admin-text-subtle"}`} />
      {active ? "Active" : "Inactive"}
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

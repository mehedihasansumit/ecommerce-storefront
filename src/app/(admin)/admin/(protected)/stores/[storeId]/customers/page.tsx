import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Users, Mail, Phone, MapPin, ShoppingBag, ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { AuthService } from "@/features/auth/service";
import { OrderService } from "@/features/orders/service";
import { StoreService } from "@/features/stores/service";
import { Badge, Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { CustomersSearch } from "./CustomersSearch";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 15;

const PAGE_BTN =
  "focus-ring w-10 h-10 flex items-center justify-center rounded-lg transition-colors";

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

  const [{ customers, total }, orderStats, store] = await Promise.all([
    AuthService.getCustomersByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      search: q || undefined,
      status,
    }),
    OrderService.getCustomerOrderStats(storeId),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  const statsMap = new Map(orderStats.map((s) => [s.userId, s]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total} ${total === 1 ? "customer" : "customers"}`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Customers" },
            ]}
          />
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <CustomersSearch storeId={storeId} defaultValue={q} />

        <div className="flex flex-wrap items-center gap-1 ml-auto" aria-label="Filter by status" role="group">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <Link
              key={s}
              href={buildHref(storeId, { q, status: s })}
              aria-current={status === s ? "page" : undefined}
              className={`focus-ring px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                status === s
                  ? "bg-admin-text-primary text-admin-surface border-admin-text-primary"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-admin-text-subtle"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Users}
            title="No customers found"
            description={
              q
                ? `No customers match "${q}".`
                : status !== "all"
                ? `No ${status} customers yet.`
                : "Customers will appear here once they register."
            }
          />
        </Card>
      ) : (
        <>
          {/* Pagination info */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, status, page: currentPage - 1 })}
                  aria-label="Previous page"
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
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
                        aria-hidden
                        className="w-10 h-10 flex items-center justify-center text-xs text-admin-text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, status, page: item as number })}
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
                  href={buildHref(storeId, { q, status, page: currentPage + 1 })}
                  aria-label="Next page"
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`${PAGE_BTN} border text-admin-text-muted ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          )}

          <Card padding="none" className="overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-175">
                <thead>
                  <tr className="border-b border-admin-border-md bg-admin-surface-raised">
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Customer
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Contact
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Location
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Orders
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Spent
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Points
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Joined
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
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
                        className="hover:bg-admin-surface-hover transition-colors"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-admin-text-primary flex items-center justify-center text-admin-surface text-xs font-bold shrink-0"
                              aria-hidden>
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
                                <Mail aria-hidden className="w-3 h-3 shrink-0 text-admin-text-subtle" />
                                {customer.email}
                              </p>
                            )}
                            {customer.phone && (
                              <p className="text-xs text-admin-text-secondary flex items-center gap-1.5">
                                <Phone aria-hidden className="w-3 h-3 shrink-0 text-admin-text-subtle" />
                                {customer.phone}
                              </p>
                            )}
                            {!customer.email && !customer.phone && (
                              <span className="text-xs text-admin-text-muted">—</span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          {defaultAddress ? (
                            <span className="text-xs text-admin-text-muted flex items-center gap-1">
                              <MapPin aria-hidden className="w-3 h-3 text-admin-text-subtle shrink-0" />
                              {[defaultAddress.city, defaultAddress.country]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </span>
                          ) : (
                            <span className="text-xs text-admin-text-muted">—</span>
                          )}
                        </td>

                        {/* Orders */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag aria-hidden className="w-3.5 h-3.5 text-admin-text-subtle" />
                            <span className="text-sm font-medium text-admin-text-primary">
                              {stats?.orderCount ?? 0}
                            </span>
                          </div>
                          {stats?.lastOrderAt && (
                            <p className="text-xs text-admin-text-muted mt-0.5">
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
                            <span className="text-sm text-admin-text-muted">—</span>
                          )}
                        </td>

                        {/* Points */}
                        <td className="px-5 py-4">
                          {(customer.points ?? 0) > 0 ? (
                            <Link
                              href={`/admin/stores/${storeId}/points/${customer._id}`}
                              className="focus-ring rounded inline-flex items-center gap-1.5 text-sm font-medium text-admin-text-primary hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                            >
                              <Coins aria-hidden className="w-3.5 h-3.5 text-amber-500" />
                              {(customer.points ?? 0).toLocaleString()}
                            </Link>
                          ) : (
                            <span className="text-sm text-admin-text-muted">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <Badge tone={customer.isActive ? "success" : "neutral"}>
                            <span
                              aria-hidden
                              className={`w-1.5 h-1.5 rounded-full ${
                                customer.isActive ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            {customer.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
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
                              className={buttonClassName({ variant: "ghost", size: "sm" })}
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
          </Card>
        </>
      )}
    </div>
  );
}

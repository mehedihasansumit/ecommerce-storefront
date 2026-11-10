import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  Coins,
  TrendingDown,
  Users,
  ChevronLeft,
  ChevronRight,
  Settings,
  Gift,
  Star,
} from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { PointService } from "@/features/points/service";
import { StoreService } from "@/features/stores/service";
import { Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { PointsCustomerSearch } from "./PointsCustomerSearch";

const PAGE_SIZE = 15;
const LEDGER_SIZE = 20;

const PAGE_BTN =
  "focus-ring w-10 h-10 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function reasonLabel(reason: string) {
  if (reason === "review_approved") return "Review approved";
  if (reason === "redemption") return "Redemption";
  return reason;
}

function reasonIcon(reason: string) {
  if (reason === "review_approved") return Star;
  if (reason === "redemption") return Gift;
  return Coins;
}

function buildHref(
  storeId: string,
  overrides: { q?: string; page?: number }
) {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
  const qs = p.toString();
  return `/admin/stores/${storeId}/points${qs ? `?${qs}` : ""}`;
}

export default async function StorePointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.POINTS_VIEW)) redirect("/admin");

  const { q, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const canManage = hasPermission(adminUser, PERMISSIONS.POINTS_MANAGE);

  const [stats, { customers, total, totalPages }, ledger, config, store] =
    await Promise.all([
      PointService.getStoreStats(storeId),
      PointService.getTopCustomers(storeId, {
        page,
        limit: PAGE_SIZE,
        search: q || undefined,
      }),
      PointService.getStoreLedger(storeId, 1, LEDGER_SIZE),
      PointService.getConfig(storeId),
      StoreService.getById(storeId),
    ]);

  if (!store) notFound();

  const currentPage = Math.min(page, totalPages);

  const statCards = [
    {
      icon: Coins,
      iconClass: "text-amber-500",
      label: "Outstanding",
      value: stats.outstanding.toLocaleString(),
      hint: `≈ ৳${Math.floor(stats.outstanding / config.pointsPerBdt).toLocaleString()} liability`,
    },
    {
      icon: Star,
      iconClass: "text-emerald-500",
      label: "Earned",
      value: stats.totalEarned.toLocaleString(),
      hint: "lifetime",
    },
    {
      icon: TrendingDown,
      iconClass: "text-rose-500",
      label: "Redeemed",
      value: stats.totalRedeemed.toLocaleString(),
      hint: `${stats.transactionCount} transactions`,
    },
    {
      icon: Users,
      iconClass: "text-violet-500",
      label: "Holders",
      value: stats.activeHolders.toLocaleString(),
      hint: "with balance > 0",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Loyalty Points"
        description={
          config.enabled ? (
            <>
              {config.pointsPerReview} pts per review · {config.minRedemptionPoints} pts min redemption · {config.pointsPerBdt} pts = ৳1
            </>
          ) : (
            <span className="text-red-600 dark:text-red-400">Points earning is disabled for this store</span>
          )
        }
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Loyalty Points" },
            ]}
          />
        }
        actions={
          canManage && (
            <Link
              href={`/admin/stores/${storeId}#loyalty-points`}
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              <Settings aria-hidden className="w-4 h-4" />
              Configure
            </Link>
          )
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ icon: Icon, iconClass, label, value, hint }) => (
          <Card key={label} padding="md">
            <div className="flex items-center gap-2 mb-1">
              <Icon aria-hidden className={`w-4 h-4 ${iconClass}`} />
              <span className="text-xs font-medium text-admin-text-muted uppercase tracking-wide">
                {label}
              </span>
            </div>
            <p className="text-xl font-bold text-admin-text-primary">{value}</p>
            <p className="text-xs text-admin-text-muted mt-0.5">{hint}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PointsCustomerSearch storeId={storeId} defaultValue={q} />
        <p className="text-xs text-admin-text-muted ml-auto">
          {total} {total === 1 ? "customer" : "customers"}
        </p>
      </div>

      {/* Top customers table */}
      {total === 0 ? (
        <Card padding="none" className="mb-6">
          <EmptyState
            icon={Coins}
            title="No customers yet"
            description={
              q
                ? `No customers match "${q}".`
                : "Customer points will appear here once they earn or redeem."
            }
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden mb-6">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-150">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-surface-raised">
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Customer
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Contact
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Points
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      ≈ BDT
                    </th>
                    <th scope="col" className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {customers.map((c) => {
                    const equivalentBdt = Math.floor(
                      (c.points ?? 0) / config.pointsPerBdt
                    );
                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-admin-surface-hover transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-admin-text-primary">
                            {c.name}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-admin-text-muted">
                          {c.email || c.phone || "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-admin-text-primary">
                            {(c.points ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-admin-text-secondary">
                          ৳{equivalentBdt.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/stores/${storeId}/points/${c._id}`}
                            className={buttonClassName({ variant: "ghost", size: "sm" })}
                          >
                            View ledger
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <p className="text-xs text-admin-text-muted">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, page: currentPage - 1 })}
                  aria-label="Previous page"
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`${PAGE_BTN} ${currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </Link>
                <Link
                  href={buildHref(storeId, { q, page: currentPage + 1 })}
                  aria-label="Next page"
                  aria-disabled={currentPage >= totalPages}
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`${PAGE_BTN} ${currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          )}
        </>
      )}

      {/* Recent ledger */}
      {ledger.transactions.length > 0 && (
        <section aria-labelledby="recent-transactions">
          <h2 id="recent-transactions" className="text-xs font-semibold text-admin-text-muted uppercase tracking-wider mb-3 px-0.5">
            Recent Transactions
          </h2>
          <Card padding="none" className="overflow-hidden">
            <div className="divide-y divide-admin-border">
              {ledger.transactions.map((t) => {
                const Icon = reasonIcon(t.reason);
                const user = ledger.users[t.userId];
                const positive = t.amount > 0;
                return (
                  <Link
                    key={t._id}
                    href={`/admin/stores/${storeId}/points/${t.userId}`}
                    className="focus-ring-inset flex items-center gap-4 px-5 py-3.5 hover:bg-admin-surface-hover transition-colors"
                  >
                    <div
                      aria-hidden
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${positive
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary truncate">
                        {user?.name ?? "Unknown customer"}
                      </p>
                      <p className="text-xs text-admin-text-muted">
                        {reasonLabel(t.reason)} · {formatDate(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                    >
                      {positive ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}

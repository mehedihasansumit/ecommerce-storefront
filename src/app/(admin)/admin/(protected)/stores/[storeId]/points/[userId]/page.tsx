import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronRight,
  Coins,
  Star,
  Gift,
  Mail,
  Phone,
  ChevronLeft,
} from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { PointService } from "@/features/points/service";
import { StoreService } from "@/features/stores/service";
import { Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";

const LEDGER_SIZE = 25;

const PAGE_BTN =
  "focus-ring w-10 h-10 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors";

function formatDateTime(d: string | Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function buildHref(storeId: string, userId: string, page: number) {
  const qs = page > 1 ? `?page=${page}` : "";
  return `/admin/stores/${storeId}/points/${userId}${qs}`;
}

export default async function CustomerPointsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; userId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId, userId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.POINTS_VIEW)) redirect("/admin");

  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [summary, store] = await Promise.all([
    PointService.getCustomerSummary(storeId, userId, {
      page,
      limit: LEDGER_SIZE,
    }),
    StoreService.getById(storeId),
  ]);

  if (!summary) notFound();
  if (!store) notFound();

  const { user, balance, ledger, config } = summary;
  const currentPage = Math.min(page, Math.max(1, ledger.totalPages));

  return (
    <div>
      <PageHeader
        title={user.name}
        description={
          user.email || user.phone ? (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {user.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail aria-hidden className="w-3.5 h-3.5" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone aria-hidden className="w-3.5 h-3.5" />
                  {user.phone}
                </span>
              )}
            </span>
          ) : undefined
        }
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Loyalty Points", href: `/admin/stores/${storeId}/points` },
              { label: user.name },
            ]}
          />
        }
      />

      {/* Balance */}
      <Card padding="lg" className="mb-6">
        <dl className="flex flex-wrap items-start gap-8">
          <div>
            <dt className="text-xs text-admin-text-muted uppercase tracking-wide mb-1">
              Balance
            </dt>
            <dd>
              <p className="text-2xl font-bold text-admin-text-primary">
                {balance.points.toLocaleString()}
              </p>
              <p className="text-xs text-admin-text-muted mt-0.5">
                ≈ ৳{balance.equivalentBDT.toLocaleString()}
              </p>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-admin-text-muted uppercase tracking-wide mb-1">
              To redeem
            </dt>
            <dd>
              <p className="text-2xl font-bold text-admin-text-primary">
                {balance.pointsNeeded > 0
                  ? balance.pointsNeeded.toLocaleString()
                  : "—"}
              </p>
              <p className="text-xs text-admin-text-muted mt-0.5">
                {balance.pointsNeeded > 0
                  ? `${config.minRedemptionPoints} min`
                  : "eligible now"}
              </p>
            </dd>
          </div>
        </dl>
      </Card>

      {/* Ledger */}
      <h2 className="text-xs font-semibold text-admin-text-muted uppercase tracking-wider mb-3 px-0.5">
        Transaction History
      </h2>

      {ledger.total === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Coins}
            title="No transactions yet"
            description="Points earned or redeemed will appear here."
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden mb-6">
            <div className="divide-y divide-admin-border">
              {ledger.transactions.map((t) => {
                const Icon = reasonIcon(t.reason);
                const positive = t.amount > 0;
                return (
                  <div
                    key={t._id}
                    className="flex items-center gap-4 px-5 py-3.5"
                  >
                    <div
                      aria-hidden
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        positive
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary">
                        {reasonLabel(t.reason)}
                      </p>
                      <p className="text-xs text-admin-text-muted">
                        {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {ledger.totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <p className="text-xs text-admin-text-muted">
                Page {currentPage} of {ledger.totalPages} · {ledger.total}{" "}
                {ledger.total === 1 ? "transaction" : "transactions"}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, userId, currentPage - 1)}
                  aria-label="Previous page"
                  aria-disabled={currentPage <= 1}
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`${PAGE_BTN} ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </Link>
                <Link
                  href={buildHref(storeId, userId, currentPage + 1)}
                  aria-label="Next page"
                  aria-disabled={currentPage >= ledger.totalPages}
                  tabIndex={currentPage >= ledger.totalPages ? -1 : undefined}
                  className={`${PAGE_BTN} ${
                    currentPage >= ledger.totalPages
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
    </div>
  );
}

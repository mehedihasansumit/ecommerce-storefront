import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  Star,
  Gift,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { PointService } from "@/features/points/service";

const LEDGER_SIZE = 25;

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

  const summary = await PointService.getCustomerSummary(storeId, userId, {
    page,
    limit: LEDGER_SIZE,
  });

  if (!summary) notFound();

  const { user, balance, ledger, config } = summary;
  const currentPage = Math.min(page, Math.max(1, ledger.totalPages));

  return (
    <div>
      {/* Back */}
      <div className="mb-4">
        <Link
          href={`/admin/stores/${storeId}/points`}
          className="inline-flex items-center gap-1.5 text-xs text-admin-text-muted hover:text-admin-text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to loyalty points
        </Link>
      </div>

      {/* Customer header */}
      <div className="bg-admin-surface rounded-xl border border-admin-border p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-xl font-bold text-admin-text-primary">{user.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-admin-text-muted">
              {user.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-admin-text-subtle uppercase tracking-wide mb-1">
                Balance
              </p>
              <p className="text-2xl font-bold text-admin-text-primary">
                {balance.points.toLocaleString()}
              </p>
              <p className="text-xs text-admin-text-muted mt-0.5">
                ≈ ৳{balance.equivalentBDT.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-admin-text-subtle uppercase tracking-wide mb-1">
                To redeem
              </p>
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
            </div>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <h2 className="text-xs font-semibold text-admin-text-subtle uppercase tracking-wider mb-3 px-0.5">
        Transaction History
      </h2>

      {ledger.total === 0 ? (
        <div className="text-center py-16 bg-admin-surface rounded-xl border border-admin-border">
          <div className="w-12 h-12 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-3">
            <Coins className="w-6 h-6 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">
            No transactions yet
          </h3>
          <p className="text-sm text-admin-text-muted">
            Points earned or redeemed will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-admin-surface rounded-xl border border-admin-border overflow-hidden mb-6">
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
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        positive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary">
                        {reasonLabel(t.reason)}
                      </p>
                      <p className="text-xs text-admin-text-subtle">
                        {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        positive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {positive ? "+" : ""}
                      {t.amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {ledger.totalPages > 1 && (
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs text-admin-text-subtle">
                Page {currentPage} of {ledger.totalPages} · {ledger.total}{" "}
                {ledger.total === 1 ? "transaction" : "transactions"}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, userId, currentPage - 1)}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={buildHref(storeId, userId, currentPage + 1)}
                  aria-disabled={currentPage >= ledger.totalPages}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage >= ledger.totalPages
                      ? "opacity-30 pointer-events-none border-admin-border"
                      : "border-admin-border hover:bg-admin-chip"
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

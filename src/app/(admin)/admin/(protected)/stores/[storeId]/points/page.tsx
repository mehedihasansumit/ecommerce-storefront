import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Sparkles,
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
import { PointsCustomerSearch } from "./PointsCustomerSearch";

const PAGE_SIZE = 15;
const LEDGER_SIZE = 20;

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

  const [stats, { customers, total, totalPages }, ledger, config] =
    await Promise.all([
      PointService.getStoreStats(storeId),
      PointService.getTopCustomers(storeId, {
        page,
        limit: PAGE_SIZE,
        search: q || undefined,
      }),
      PointService.getStoreLedger(storeId, 1, LEDGER_SIZE),
      PointService.getConfig(storeId),
    ]);

  const currentPage = Math.min(page, totalPages);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Loyalty Points
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {config.enabled ? (
              <>
                {config.pointsPerReview} pts per review · {config.minRedemptionPoints} pts min redemption · {config.pointsPerBdt} pts = ৳1
              </>
            ) : (
              <span className="text-red-600">Points earning is disabled for this store</span>
            )}
          </p>
        </div>
        {canManage && (
          <Link
            href={`/admin/stores/${storeId}#loyalty-points`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configure
          </Link>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Outstanding
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.outstanding.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            ≈ ৳{Math.floor(stats.outstanding / config.pointsPerBdt).toLocaleString()} liability
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Earned
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.totalEarned.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">lifetime</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Redeemed
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.totalRedeemed.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {stats.transactionCount} transactions
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Holders
            </span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {stats.activeHolders.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">with balance {">"} 0</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <PointsCustomerSearch storeId={storeId} defaultValue={q} />
        <p className="text-xs text-gray-400 ml-auto">
          {total} {total === 1 ? "customer" : "customers"}
        </p>
      </div>

      {/* Top customers table */}
      {total === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Coins className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No customers yet
          </h3>
          <p className="text-sm text-gray-500">
            {q
              ? `No customers match "${q}".`
              : "Customer points will appear here once they earn or redeem."}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-150">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Points
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      ≈ BDT
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => {
                    const equivalentBdt = Math.floor(
                      (c.points ?? 0) / config.pointsPerBdt
                    );
                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {c.name}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500">
                          {c.email || c.phone || "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            {(c.points ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right text-sm text-gray-600">
                          ৳{equivalentBdt.toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/stores/${storeId}/points/${c._id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap"
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
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mb-8">
              <p className="text-xs text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-gray-500 transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-gray-200"
                      : "border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={buildHref(storeId, { q, page: currentPage + 1 })}
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

      {/* Recent ledger */}
      {ledger.transactions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">
            Recent Transactions
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {ledger.transactions.map((t) => {
                const Icon = reasonIcon(t.reason);
                const user = ledger.users[t.userId];
                const positive = t.amount > 0;
                return (
                  <Link
                    key={t._id}
                    href={`/admin/stores/${storeId}/points/${t.userId}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
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
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name ?? "Unknown customer"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {reasonLabel(t.reason)} · {formatDate(t.createdAt)}
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
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

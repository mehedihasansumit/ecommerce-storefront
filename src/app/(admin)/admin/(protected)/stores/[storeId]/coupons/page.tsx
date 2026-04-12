import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Ticket, CheckCircle, Clock, XCircle } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponService } from "@/features/coupons/service";
import { CouponTable } from "@/features/coupons/components/CouponTable";
import type { ICoupon } from "@/features/coupons/types";

type FilterStatus = "all" | "active" | "scheduled" | "expired" | "exhausted" | "inactive";

function getCouponStatus(coupon: ICoupon) {
  if (!coupon.isActive) return "inactive";
  const now = new Date();
  if (now < new Date(coupon.validFrom)) return "scheduled";
  if (now > new Date(coupon.validUntil)) return "expired";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "exhausted";
  return "active";
}

export default async function CouponsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.COUPONS_VIEW)) redirect("/admin");

  const { status: rawStatus } = await searchParams;
  const filterStatus: FilterStatus =
    ["all", "active", "scheduled", "expired", "exhausted", "inactive"].includes(rawStatus ?? "")
      ? (rawStatus as FilterStatus)
      : "all";

  const canCreate = hasPermission(adminUser, PERMISSIONS.COUPONS_CREATE);

  // Fetch all coupons (coupons per store are few)
  const { coupons } = await CouponService.listByStore(storeId, { limit: 500 });

  // Compute stats from full list
  const stats = coupons.reduce(
    (acc, c) => {
      acc.totalUses += c.usedCount;
      const s = getCouponStatus(c);
      if (s === "active") acc.active++;
      if (s === "expired") acc.expired++;
      if (s === "scheduled") acc.scheduled++;
      return acc;
    },
    { active: 0, expired: 0, scheduled: 0, totalUses: 0 }
  );

  const statuses: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "scheduled", label: "Scheduled" },
    { key: "expired", label: "Expired" },
    { key: "exhausted", label: "Exhausted" },
    { key: "inactive", label: "Inactive" },
  ];

  function buildHref(s: FilterStatus) {
    return s === "all"
      ? `/admin/stores/${storeId}/coupons`
      : `/admin/stores/${storeId}/coupons?status=${s}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {coupons.length} {coupons.length === 1 ? "coupon" : "coupons"} · {stats.totalUses} total uses
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/stores/${storeId}/coupons/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </Link>
        )}
      </div>

      {/* Stats cards */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{coupons.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stats.totalUses} uses</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-xs text-gray-400 mt-0.5">live now</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Scheduled</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.scheduled}</p>
            <p className="text-xs text-gray-400 mt-0.5">upcoming</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expired</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
            <p className="text-xs text-gray-400 mt-0.5">no longer valid</p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {statuses.map(({ key, label }) => (
          <Link
            key={key}
            href={buildHref(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
              filterStatus === key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <CouponTable
        coupons={JSON.parse(JSON.stringify(coupons))}
        storeId={storeId}
        filterStatus={filterStatus}
      />
    </div>
  );
}

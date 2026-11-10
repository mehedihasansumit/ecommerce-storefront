import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Plus, Ticket, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { CouponService } from "@/features/coupons/service";
import { StoreService } from "@/features/stores/service";
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
  const [{ coupons }, store] = await Promise.all([
    CouponService.listByStore(storeId, { limit: 500 }),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

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
      <PageHeader
        title="Coupons"
        description={`${coupons.length} ${coupons.length === 1 ? "coupon" : "coupons"} · ${stats.totalUses} total uses`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Coupons" },
            ]}
          />
        }
        actions={
          canCreate && (
            <Link
              href={`/admin/stores/${storeId}/coupons/new`}
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              <Plus aria-hidden className="w-4 h-4" />
              New Coupon
            </Link>
          )
        }
      />

      {/* Stats cards */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Ticket, iconClass: "text-admin-text-muted", label: "Total", value: coupons.length, hint: `${stats.totalUses} uses` },
            { icon: CheckCircle, iconClass: "text-green-500", label: "Active", value: stats.active, hint: "live now" },
            { icon: Clock, iconClass: "text-blue-500", label: "Scheduled", value: stats.scheduled, hint: "upcoming" },
            { icon: XCircle, iconClass: "text-red-400", label: "Expired", value: stats.expired, hint: "no longer valid" },
          ].map(({ icon: Icon, iconClass, label, value, hint }) => (
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
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="Filter coupons by status">
        {statuses.map(({ key, label }) => (
          <Link
            key={key}
            href={buildHref(key)}
            aria-current={filterStatus === key ? "page" : undefined}
            className={`focus-ring px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
              filterStatus === key
                ? "bg-admin-text-primary text-admin-surface border-admin-text-primary"
                : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-admin-text-subtle"
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

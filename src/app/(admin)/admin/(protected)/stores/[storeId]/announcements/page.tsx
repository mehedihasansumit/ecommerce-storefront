import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Plus, Megaphone, Radio, Clock, XCircle } from "lucide-react";
import { Card, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { NotificationService } from "@/features/notifications/service";
import { StoreService } from "@/features/stores/service";
import { AnnouncementTable } from "@/features/notifications/components/AnnouncementTable";
import type { IAnnouncement } from "@/features/notifications/types";

type FilterStatus = "all" | "live" | "scheduled" | "expired" | "inactive";

function getAnnouncementStatus(a: IAnnouncement) {
  if (!a.isActive) return "inactive";
  const now = new Date();
  if (now < new Date(a.startDate)) return "scheduled";
  if (a.endDate && now > new Date(a.endDate)) return "expired";
  return "live";
}

export default async function AnnouncementsPage({
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
  if (!hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_VIEW)) redirect("/admin");

  const { status: rawStatus } = await searchParams;
  const filterStatus: FilterStatus =
    ["all", "live", "scheduled", "expired", "inactive"].includes(rawStatus ?? "")
      ? (rawStatus as FilterStatus)
      : "all";

  const canCreate = hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_CREATE);

  const [{ announcements }, store] = await Promise.all([
    NotificationService.listAnnouncements(storeId),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  // Compute stats from full list
  const stats = announcements.reduce(
    (acc, a) => {
      const s = getAnnouncementStatus(a);
      if (s === "live") acc.live++;
      if (s === "scheduled") acc.scheduled++;
      if (s === "expired") acc.expired++;
      if (s === "inactive") acc.inactive++;
      return acc;
    },
    { live: 0, scheduled: 0, expired: 0, inactive: 0 }
  );

  const statuses: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "scheduled", label: "Scheduled" },
    { key: "expired", label: "Expired" },
    { key: "inactive", label: "Inactive" },
  ];

  function buildHref(s: FilterStatus) {
    return s === "all"
      ? `/admin/stores/${storeId}/announcements`
      : `/admin/stores/${storeId}/announcements?status=${s}`;
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description={`${announcements.length} ${announcements.length === 1 ? "announcement" : "announcements"} · ${stats.live} live`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Announcements" },
            ]}
          />
        }
        actions={
          canCreate && (
            <Link
              href={`/admin/stores/${storeId}/announcements/new`}
              className={buttonClassName({ variant: "primary", size: "md" })}
            >
              <Plus aria-hidden className="w-4 h-4" />
              New Announcement
            </Link>
          )
        }
      />

      {/* Stats cards */}
      {announcements.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Megaphone, iconClass: "text-admin-text-muted", label: "Total", value: announcements.length, hint: "all announcements" },
            { icon: Radio, iconClass: "text-green-500", label: "Live", value: stats.live, hint: "showing now" },
            { icon: Clock, iconClass: "text-blue-500", label: "Scheduled", value: stats.scheduled, hint: "upcoming" },
            { icon: XCircle, iconClass: "text-red-400", label: "Expired", value: stats.expired, hint: "no longer active" },
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
      <div className="flex flex-wrap gap-1.5 mb-5" role="group" aria-label="Filter announcements by status">
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

      <AnnouncementTable
        announcements={JSON.parse(JSON.stringify(announcements))}
        storeId={storeId}
        filterStatus={filterStatus}
      />
    </div>
  );
}

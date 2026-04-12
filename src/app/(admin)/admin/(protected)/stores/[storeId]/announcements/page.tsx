import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Megaphone, Radio, Clock, XCircle } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { NotificationService } from "@/features/notifications/service";
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

  const { announcements } = await NotificationService.listAnnouncements(storeId);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {announcements.length}{" "}
            {announcements.length === 1 ? "announcement" : "announcements"} ·{" "}
            {stats.live} live
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/stores/${storeId}/announcements/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </Link>
        )}
      </div>

      {/* Stats cards */}
      {announcements.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{announcements.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">all announcements</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Live
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.live}</p>
            <p className="text-xs text-gray-400 mt-0.5">showing now</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Scheduled
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.scheduled}</p>
            <p className="text-xs text-gray-400 mt-0.5">upcoming</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Expired
              </span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.expired}</p>
            <p className="text-xs text-gray-400 mt-0.5">no longer active</p>
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

      <AnnouncementTable
        announcements={JSON.parse(JSON.stringify(announcements))}
        storeId={storeId}
        filterStatus={filterStatus}
      />
    </div>
  );
}

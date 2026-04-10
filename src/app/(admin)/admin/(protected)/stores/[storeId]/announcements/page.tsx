import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { NotificationService } from "@/features/notifications/service";
import { AnnouncementTable } from "@/features/notifications/components/AnnouncementTable";

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_VIEW)) redirect("/admin");

  const { announcements } = await NotificationService.listAnnouncements(storeId);
  const canCreate = hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_CREATE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-gray-500">
            Display banners and alerts on your storefront
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/admin/stores/${storeId}/announcements/new`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Announcement
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AnnouncementTable
          announcements={JSON.parse(JSON.stringify(announcements))}
          storeId={storeId}
        />
      </div>
    </div>
  );
}

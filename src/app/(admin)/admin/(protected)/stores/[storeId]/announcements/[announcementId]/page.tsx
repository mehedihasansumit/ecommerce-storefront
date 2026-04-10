import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { NotificationService } from "@/features/notifications/service";
import { AnnouncementForm } from "@/features/notifications/components/AnnouncementForm";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ storeId: string; announcementId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId, announcementId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_CREATE)) redirect("/admin");

  const announcement = await NotificationService.getAnnouncement(storeId, announcementId);
  if (!announcement) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Announcement</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AnnouncementForm
          storeId={storeId}
          announcement={JSON.parse(JSON.stringify(announcement))}
        />
      </div>
    </div>
  );
}

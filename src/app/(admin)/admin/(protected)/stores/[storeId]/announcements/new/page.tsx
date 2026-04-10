import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { AnnouncementForm } from "@/features/notifications/components/AnnouncementForm";

export default async function NewAnnouncementPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");
  if (!hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_CREATE)) redirect("/admin");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create Announcement</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <AnnouncementForm storeId={storeId} />
      </div>
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { Card, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { NotificationService } from "@/features/notifications/service";
import { StoreService } from "@/features/stores/service";
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

  const [announcement, store] = await Promise.all([
    NotificationService.getAnnouncement(storeId, announcementId),
    StoreService.getById(storeId),
  ]);
  if (!announcement) notFound();
  if (!store) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Announcement"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Announcements", href: `/admin/stores/${storeId}/announcements` },
              { label: "Edit Announcement" },
            ]}
          />
        }
      />
      <Card padding="lg">
        <AnnouncementForm
          storeId={storeId}
          announcement={JSON.parse(JSON.stringify(announcement))}
        />
      </Card>
    </div>
  );
}

import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { StoreService } from "@/features/stores/service";
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

  const store = await StoreService.getById(storeId);
  if (!store) notFound();

  return (
    <div>
      <nav className="flex items-center gap-1.5 text-sm text-admin-text-muted mb-3 flex-wrap">
        <Link href="/admin" className="hover:text-admin-text-secondary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/admin/stores" className="hover:text-admin-text-secondary transition-colors">Stores</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/admin/stores/${storeId}`} className="hover:text-admin-text-secondary transition-colors">{store.name}</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href={`/admin/stores/${storeId}/announcements`} className="hover:text-admin-text-secondary transition-colors">Announcements</Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-admin-text-secondary font-medium">New Announcement</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Create Announcement</h1>
      <div className="bg-admin-surface rounded-lg border border-admin-border p-6 overflow-visible">
        <AnnouncementForm storeId={storeId} />
      </div>
    </div>
  );
}

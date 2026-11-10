import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAdminDbUser } from "@/shared/lib/auth";
import { StoreService } from "@/features/stores/service";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";
import { BlobCleanupClient } from "@/features/maintenance/components/BlobCleanupClient";

export const metadata: Metadata = { title: "Storage Cleanup" };

export default async function MaintenancePage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const stores = await StoreService.getAll();
  const storeOptions = stores.map((s) => ({ id: s._id, name: s.name }));

  return (
    <div>
      {/* BlobCleanupClient renders its own PageHeader; the trail sits above it like PageHeader's breadcrumbs slot. */}
      <div className="mb-2">
        <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Storage Cleanup" }]} />
      </div>
      <BlobCleanupClient stores={storeOptions} />
    </div>
  );
}

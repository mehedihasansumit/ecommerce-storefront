import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { StoreService } from "@/features/stores/service";
import { RoleService } from "@/features/roles/service";
import { AdminForm } from "@/features/auth/components/AdminForm";

import { AdminBreadcrumbs } from "../../../_components/AdminBreadcrumbs";
import { PageHeader } from "@/shared/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Admin" };

export default async function NewAdminPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const [stores, roles] = await Promise.all([
    StoreService.getAll(),
    RoleService.list(),
  ]);
  const storeOptions = stores.map((s) => ({ _id: s._id, name: s.name }));

  return (
    <div>
      <PageHeader
        title="New Admin"
        description="Create a new admin account"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Admins", href: "/admin/admins" },
              { label: "New Admin" },
            ]}
          />
        }
      />
      <AdminForm stores={storeOptions} roles={roles} />
    </div>
  );
}

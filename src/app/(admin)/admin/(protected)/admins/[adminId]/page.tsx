import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";
import { StoreService } from "@/features/stores/service";
import { RoleService } from "@/features/roles/service";
import { AdminForm } from "@/features/auth/components/AdminForm";

import { AdminBreadcrumbs } from "../../../_components/AdminBreadcrumbs";
import { PageHeader } from "@/shared/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Admin" };

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ adminId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const { adminId } = await params;
  const [admin, stores, roles] = await Promise.all([
    AuthService.getAdminWithRole(adminId),
    StoreService.getAll(),
    RoleService.list(),
  ]);
  if (!admin) notFound();

  const storeOptions = stores.map((s) => ({ _id: s._id, name: s.name }));
  const { passwordHash: _, ...safeAdmin } = admin;

  return (
    <div>
      <PageHeader
        title="Edit Admin"
        description={admin.email}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Admins", href: "/admin/admins" },
              { label: admin.name || admin.email },
            ]}
          />
        }
      />
      <AdminForm admin={safeAdmin} stores={storeOptions} roles={roles} />
    </div>
  );
}

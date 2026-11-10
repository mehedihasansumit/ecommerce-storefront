import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleService } from "@/features/roles/service";
import { RoleForm } from "@/features/roles/components/RoleForm";

import { AdminBreadcrumbs } from "../../../_components/AdminBreadcrumbs";
import { PageHeader } from "@/shared/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Role" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const { roleId } = await params;
  const role = await RoleService.getById(roleId);
  if (!role) notFound();

  return (
    <div>
      <PageHeader
        title="Edit Role"
        description={role.name}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Roles", href: "/admin/roles" },
              { label: role.name },
            ]}
          />
        }
      />
      <RoleForm role={role} />
    </div>
  );
}

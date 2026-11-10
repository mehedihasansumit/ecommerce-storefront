import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleForm } from "@/features/roles/components/RoleForm";

import { AdminBreadcrumbs } from "../../../_components/AdminBreadcrumbs";
import { PageHeader } from "@/shared/components/ui";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Role" };

export default async function NewRolePage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  return (
    <div>
      <PageHeader
        title="New Role"
        description="Create a reusable permission template for managers"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Roles", href: "/admin/roles" },
              { label: "New Role" },
            ]}
          />
        }
      />
      <RoleForm />
    </div>
  );
}

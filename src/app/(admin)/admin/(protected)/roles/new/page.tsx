import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleForm } from "@/features/roles/components/RoleForm";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Role" };

export default async function NewRolePage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-admin-text-primary">New Role</h1>
        <p className="text-sm text-admin-text-muted mt-1">
          Create a reusable permission template for managers
        </p>
      </div>
      <RoleForm />
    </div>
  );
}

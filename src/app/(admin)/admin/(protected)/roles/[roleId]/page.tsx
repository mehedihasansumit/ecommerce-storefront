import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleService } from "@/features/roles/service";
import { RoleForm } from "@/features/roles/components/RoleForm";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Role" };

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || adminUser.role !== "superadmin") redirect("/admin");

  const { roleId } = await params;
  const role = await RoleService.getById(roleId);
  if (!role) notFound();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
        <p className="text-sm text-gray-500 mt-1">{role.name}</p>
      </div>
      <RoleForm role={role} />
    </div>
  );
}

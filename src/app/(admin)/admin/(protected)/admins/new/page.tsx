import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { StoreService } from "@/features/stores/service";
import { RoleService } from "@/features/roles/service";
import { AdminForm } from "@/features/auth/components/AdminForm";

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Create a new admin account</p>
      </div>
      <AdminForm stores={storeOptions} roles={roles} />
    </div>
  );
}

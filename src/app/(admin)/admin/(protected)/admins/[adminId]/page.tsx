import { redirect, notFound } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { AuthRepository } from "@/features/auth/repository";
import { StoreService } from "@/features/stores/service";
import { RoleService } from "@/features/roles/service";
import { AdminForm } from "@/features/auth/components/AdminForm";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Admin" };

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ adminId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser || adminUser.role !== "superadmin") redirect("/admin");

  const { adminId } = await params;
  const [admin, stores, roles] = await Promise.all([
    AuthRepository.findAdminById(adminId),
    StoreService.getAll(),
    RoleService.list(),
  ]);
  if (!admin) notFound();

  const storeOptions = stores.map((s) => ({ _id: s._id, name: s.name }));
  const { passwordHash: _, ...safeAdmin } = admin;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Admin</h1>
        <p className="text-sm text-gray-500 mt-1">{admin.email}</p>
      </div>
      <AdminForm admin={safeAdmin} stores={storeOptions} roles={roles} />
    </div>
  );
}

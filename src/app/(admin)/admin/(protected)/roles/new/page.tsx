import { redirect } from "next/navigation";
import { getAdminToken } from "@/shared/lib/auth";
import { RoleForm } from "@/features/roles/components/RoleForm";
import type { JwtAdminPayload } from "@/features/auth/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Role" };

export default async function NewRolePage() {
  const payload = (await getAdminToken()) as JwtAdminPayload | null;
  if (!payload || payload.role !== "superadmin") redirect("/admin");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New Role</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a reusable permission template for managers
        </p>
      </div>
      <RoleForm />
    </div>
  );
}

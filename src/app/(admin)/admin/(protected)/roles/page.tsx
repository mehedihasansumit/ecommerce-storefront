import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleService } from "@/features/roles/service";

import type { Metadata } from "next";
import { Shield, Plus } from "lucide-react";
import { PERMISSION_LABELS } from "@/shared/lib/permissions";
import type { Permission } from "@/shared/lib/permissions";

export const metadata: Metadata = { title: "Manage Roles" };

export default async function RolesPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const roles = await RoleService.list();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Roles</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {roles.length} {roles.length === 1 ? "role" : "roles"} total
          </p>
        </div>
        <Link
          href="/admin/roles/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Role
        </Link>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No roles yet</h3>
          <p className="text-sm text-admin-text-muted mb-6">
            Create reusable permission templates to assign to managers.
          </p>
          <Link
            href="/admin/roles/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Role
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role._id}
              className="bg-admin-surface rounded-xl border border-admin-border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-blue-500 shrink-0" />
                    <h3 className="text-sm font-semibold text-admin-text-primary">{role.name}</h3>
                  </div>
                  {role.description && (
                    <p className="text-xs text-admin-text-muted mb-3">{role.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {role.isSuperAdmin ? (
                      <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-md">
                        All permissions (Super Admin)
                      </span>
                    ) : role.permissions.length === 0 ? (
                      <span className="text-xs text-admin-text-subtle">No permissions</span>
                    ) : (
                      role.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
                        >
                          {PERMISSION_LABELS[perm as Permission] ?? perm}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <Link
                  href={`/admin/roles/${role._id}`}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

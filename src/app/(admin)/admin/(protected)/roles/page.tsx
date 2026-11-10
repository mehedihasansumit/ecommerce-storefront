import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { RoleService } from "@/features/roles/service";

import type { Metadata } from "next";
import { Shield, Plus } from "lucide-react";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";
import { PERMISSION_LABELS } from "@/shared/lib/permissions";
import type { Permission } from "@/shared/lib/permissions";

export const metadata: Metadata = { title: "Manage Roles" };

export default async function RolesPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const roles = await RoleService.list();

  return (
    <div>
      <PageHeader
        title="Roles"
        description={`${roles.length} ${roles.length === 1 ? "role" : "roles"} total`}
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Roles" }]} />
        }
        actions={
          <Link href="/admin/roles/new" className={buttonClassName({ variant: "primary", size: "md" })}>
            <Plus size={16} aria-hidden />
            New Role
          </Link>
        }
      />

      {roles.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Shield}
            title="No roles yet"
            description="Create reusable permission templates to assign to managers."
            action={
              <Link href="/admin/roles/new" className={buttonClassName({ variant: "primary", size: "md" })}>
                <Plus size={16} aria-hidden />
                Create Role
              </Link>
            }
          />
        </Card>
      ) : (
        <ul className="space-y-4">
          {roles.map((role) => (
            <li key={role._id}>
              <Card padding="md" className="sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield aria-hidden className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <h2 className="text-sm font-semibold text-admin-text-primary">{role.name}</h2>
                    </div>
                    {role.description && (
                      <p className="text-xs text-admin-text-muted mb-3">{role.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {role.isSuperAdmin ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-xs font-medium rounded-md">
                          All permissions (Super Admin)
                        </span>
                      ) : role.permissions.length === 0 ? (
                        <span className="text-xs text-admin-text-muted">No permissions</span>
                      ) : (
                        role.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs rounded-md"
                          >
                            {PERMISSION_LABELS[perm as Permission] ?? perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/admin/roles/${role._id}`}
                    aria-label={`Edit role ${role.name}`}
                    className={buttonClassName({ variant: "secondary", size: "sm", className: "shrink-0 min-h-10 sm:min-h-0" })}
                  >
                    Edit
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

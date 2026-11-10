import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";

import type { Metadata } from "next";
import { UserCog, Plus, Shield, ShieldCheck } from "lucide-react";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";

export const metadata: Metadata = { title: "Manage Admins" };

export default async function AdminsPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const admins = await AuthService.listAdmins();

  const editLinkClass = buttonClassName({ variant: "secondary", size: "sm", className: "min-h-10 sm:min-h-0" });
  const thClass = "text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";

  return (
    <div>
      <PageHeader
        title="Admins"
        description={`${admins.length} ${admins.length === 1 ? "admin" : "admins"} total`}
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Admins" }]} />
        }
        actions={
          <Link href="/admin/admins/new" className={buttonClassName({ variant: "primary", size: "md" })}>
            <Plus size={16} aria-hidden />
            New Admin
          </Link>
        }
      />

      {admins.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={UserCog}
            title="No admins yet"
            description="Create your first admin account."
            action={
              <Link href="/admin/admins/new" className={buttonClassName({ variant: "primary", size: "md" })}>
                <Plus size={16} aria-hidden />
                Create Admin
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {admins.map((admin) => (
              <li key={admin._id}>
                <Card padding="md" className="flex flex-col gap-3">
                  {/* Name + email */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-admin-text-primary truncate">{admin.name}</p>
                      <p className="text-xs text-admin-text-muted truncate">{admin.email}</p>
                    </div>
                    <RolePill isSuperAdmin={admin.role.isSuperAdmin} name={admin.role.name} />
                  </div>

                  {/* Permissions + action */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-admin-border">
                    <span className="text-xs text-admin-text-muted">
                      {admin.role.isSuperAdmin
                        ? "All permissions"
                        : `${admin.role.permissions.length} permission${admin.role.permissions.length !== 1 ? "s" : ""}`}
                    </span>
                    <Link
                      href={`/admin/admins/${admin._id}`}
                      aria-label={`Edit ${admin.name}`}
                      className={editLinkClass}
                    >
                      Edit
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <Card padding="none" className="hidden sm:block overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-admin-border bg-admin-surface-raised">
                    <th scope="col" className={thClass}>Admin</th>
                    <th scope="col" className={thClass}>Role</th>
                    <th scope="col" className={thClass}>Permissions</th>
                    <th scope="col" className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {admins.map((admin) => (
                    <tr key={admin._id} className="hover:bg-admin-surface-hover transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-admin-text-primary">{admin.name}</p>
                        <p className="text-xs text-admin-text-muted">{admin.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <RolePill isSuperAdmin={admin.role.isSuperAdmin} name={admin.role.name} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-admin-text-muted">
                          {admin.role.isSuperAdmin
                            ? "All permissions"
                            : `${admin.role.permissions.length} permission${admin.role.permissions.length !== 1 ? "s" : ""}`}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/admin/admins/${admin._id}`}
                            aria-label={`Edit ${admin.name}`}
                            className={editLinkClass}
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/** Role chip: icon + name, so the role is never signalled by colour alone. */
function RolePill({ isSuperAdmin, name }: { isSuperAdmin: boolean; name: string }) {
  const Icon = isSuperAdmin ? ShieldCheck : Shield;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0",
        isSuperAdmin
          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
          : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
      ].join(" ")}
    >
      <Icon aria-hidden className="w-3.5 h-3.5" />
      {name}
    </span>
  );
}

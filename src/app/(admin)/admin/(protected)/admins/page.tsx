import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";

import type { Metadata } from "next";
import { UserCog, Plus, Shield, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Manage Admins" };

export default async function AdminsPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || !adminUser.role.isSuperAdmin) redirect("/admin");

  const admins = await AuthService.listAdmins();

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Admins</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {admins.length} {admins.length === 1 ? "admin" : "admins"} total
          </p>
        </div>
        <Link
          href="/admin/admins/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Admin
        </Link>
      </div>

      {admins.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No admins yet</h3>
          <p className="text-sm text-admin-text-muted mb-6">Create your first admin account.</p>
          <Link
            href="/admin/admins/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Admin
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {admins.map((admin) => (
              <div
                key={admin._id}
                className="bg-admin-surface rounded-xl border border-admin-border p-4 flex flex-col gap-3"
              >
                {/* Name + email */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-admin-text-primary truncate">{admin.name}</p>
                    <p className="text-xs text-admin-text-muted truncate">{admin.email}</p>
                  </div>
                  {admin.role.isSuperAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {admin.role.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 shrink-0">
                      <Shield className="w-3.5 h-3.5" />
                      {admin.role.name}
                    </span>
                  )}
                </div>

                {/* Permissions + action */}
                <div className="flex items-center justify-between pt-1 border-t border-admin-border">
                  <span className="text-xs text-admin-text-muted">
                    {admin.role.isSuperAdmin
                      ? "All permissions"
                      : `${admin.role.permissions.length} permission${admin.role.permissions.length !== 1 ? "s" : ""}`}
                  </span>
                  <Link
                    href={`/admin/admins/${admin._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-admin-surface rounded-xl border border-admin-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-raised">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Admin
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Permissions
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {admins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-admin-surface-hover transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium text-admin-text-primary">{admin.name}</p>
                        <p className="text-xs text-admin-text-muted">{admin.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {admin.role.isSuperAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {admin.role.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Shield className="w-3.5 h-3.5" />
                          {admin.role.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {admin.role.isSuperAdmin ? (
                        <span className="text-xs text-admin-text-muted">All permissions</span>
                      ) : (
                        <span className="text-xs text-admin-text-muted">
                          {admin.role.permissions.length} permission{admin.role.permissions.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/admins/${admin._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
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
        </>
      )}
    </div>
  );
}

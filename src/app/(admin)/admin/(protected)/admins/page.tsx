import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminDbUser } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";
import { RoleService } from "@/features/roles/service";

import type { Metadata } from "next";
import { UserCog, Plus, Shield, ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Manage Admins" };

export default async function AdminsPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser || adminUser.role !== "superadmin") redirect("/admin");

  const [admins, roles] = await Promise.all([
    AuthService.listAdmins(),
    RoleService.list(),
  ]);
  const roleMap = Object.fromEntries(roles.map((r) => [r._id, r.name]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
          <p className="text-sm text-gray-500 mt-1">
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
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCog className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No admins yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first admin account.</p>
          <Link
            href="/admin/admins/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Admin
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Admin
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Permissions
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {admin.role === "superadmin" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Superadmin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <Shield className="w-3.5 h-3.5" />
                        Manager
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {admin.role === "superadmin" ? (
                      <span className="text-xs text-gray-500">All permissions</span>
                    ) : (
                      <div>
                        {admin.roleId && roleMap[admin.roleId] && (
                          <p className="text-xs font-medium text-blue-600 mb-0.5">
                            {roleMap[admin.roleId]}
                          </p>
                        )}
                        <span className="text-xs text-gray-500">
                          {admin.permissions.length} permission{admin.permissions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <Link
                        href={`/admin/admins/${admin._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
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
      )}
    </div>
  );
}

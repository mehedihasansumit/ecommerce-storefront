import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { Metadata } from "next";
import { Store, Plus, Globe, ExternalLink, Settings } from "lucide-react";

export const metadata: Metadata = { title: "Manage Stores" };

export default async function StoresPage() {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin");

  const isSuperAdmin = adminUser.role.isSuperAdmin;
  const permCtx = {
    isSuperAdmin,
    permissions: adminUser.role.permissions ?? [],
    assignedStores: adminUser.assignedStores ?? [],
  };

  // Allow access if admin has any store-scoped permission
  const hasAnyStoreAccess =
    isSuperAdmin ||
    [
      PERMISSIONS.STORES_CREATE,
      PERMISSIONS.STORES_EDIT,
      PERMISSIONS.STORES_DELETE,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.PRODUCTS_DELETE,
      PERMISSIONS.ORDERS_VIEW,
      PERMISSIONS.ORDERS_UPDATE_STATUS,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.PAYMENTS_UPDATE_STATUS,
      PERMISSIONS.PAYMENTS_DISCOUNT,
    ].some((p) => hasPermission(permCtx, p));

  if (!hasAnyStoreAccess) redirect("/admin");

  const canCreateStore = hasPermission(permCtx, PERMISSIONS.STORES_CREATE);

  // Superadmin sees all stores; others only see their assigned stores
  // (empty assignedStores means all stores — no restriction)
  const stores =
    isSuperAdmin || (adminUser.assignedStores ?? []).length === 0
      ? await StoreService.getAll()
      : await StoreService.getByIds(adminUser.assignedStores);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Stores</h1>
          <p className="text-sm text-admin-text-muted mt-1">
            {stores.length} {stores.length === 1 ? "store" : "stores"} total
          </p>
        </div>
        {canCreateStore && (
          <Link
            href="/admin/stores/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Store
          </Link>
        )}
      </div>

      {/* Empty state */}
      {stores.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No stores yet</h3>
          <p className="text-sm text-admin-text-muted mb-6">Create your first store to get started.</p>
          {canCreateStore && (
            <Link
              href="/admin/stores/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Store
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {stores.map((store) => {
              const primary = store.theme?.primaryColor || "#111827";
              const initials = store.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();

              return (
                <div
                  key={store._id}
                  className="bg-admin-surface rounded-xl border border-admin-border p-4 flex flex-col gap-3"
                >
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: primary }}
                      >
                        {store.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={store.logo}
                            alt={store.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="text-sm font-medium text-admin-text-primary truncate">{store.name}</span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                        store.isActive ? "bg-green-100 text-green-700" : "bg-admin-chip text-admin-chip-text"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          store.isActive ? "bg-green-500" : "bg-admin-text-subtle"
                        }`}
                      />
                      {store.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Domains */}
                  {store.domains.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {store.domains.slice(0, 2).map((domain) => (
                        <span
                          key={domain}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          {domain}
                        </span>
                      ))}
                      {store.domains.length > 2 && (
                        <span className="px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md">
                          +{store.domains.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-admin-border">
                    {store.domains[0] && (
                      <a
                        href={`http://${store.domains[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-admin-text-subtle hover:text-admin-text-primary transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Visit
                      </a>
                    )}
                    <Link
                      href={`/admin/stores/${store._id}`}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Manage
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-admin-surface rounded-xl border border-admin-border overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-raised">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Store
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Domains
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-admin-text-subtle uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {stores.map((store) => {
                  const primary = store.theme?.primaryColor || "#111827";
                  const initials = store.name
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr key={store._id} className="hover:bg-admin-surface-hover transition-colors">
                      {/* Store name + avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: primary }}
                          >
                            {store.logo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={store.logo}
                                alt={store.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className="text-sm font-medium text-admin-text-primary">{store.name}</span>
                        </div>
                      </td>

                      {/* Domains */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {store.domains.slice(0, 2).map((domain) => (
                            <span
                              key={domain}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              {domain}
                            </span>
                          ))}
                          {store.domains.length > 2 && (
                            <span className="px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md">
                              +{store.domains.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            store.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-admin-chip text-admin-chip-text"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              store.isActive ? "bg-green-500" : "bg-admin-text-subtle"
                            }`}
                          />
                          {store.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {store.domains[0] && (
                            <a
                              href={`http://${store.domains[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-admin-text-subtle hover:text-admin-text-primary transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Visit
                            </a>
                          )}
                          <Link
                            href={`/admin/stores/${store._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-colors"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            Manage
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { StoreService } from "@/features/stores/service";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { Metadata } from "next";
import { resolveTheme } from "@/features/stores/presets";
import { Store, Plus, Globe, ExternalLink, Settings } from "lucide-react";
import type { IStore } from "@/features/stores/types";
import { buttonClassName, Card, EmptyState, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../_components/AdminBreadcrumbs";

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

  const manageClass = buttonClassName({ variant: "secondary", size: "sm", className: "min-h-10 sm:min-h-0" });
  const visitClass =
    "inline-flex items-center gap-1 py-1 rounded text-xs text-admin-text-muted hover:text-admin-text-primary transition-colors focus-ring";
  const thClass = "text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide";

  return (
    <div>
      <PageHeader
        title="Stores"
        description={`${stores.length} ${stores.length === 1 ? "store" : "stores"} total`}
        breadcrumbs={
          <AdminBreadcrumbs items={[{ label: "Dashboard", href: "/admin" }, { label: "Stores" }]} />
        }
        actions={
          canCreateStore && (
            <Link href="/admin/stores/new" className={buttonClassName({ variant: "primary", size: "md" })}>
              <Plus size={16} aria-hidden />
              New Store
            </Link>
          )
        }
      />

      {/* Empty state */}
      {stores.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Store}
            title="No stores yet"
            description="Create your first store to get started."
            action={
              canCreateStore && (
                <Link href="/admin/stores/new" className={buttonClassName({ variant: "primary", size: "md" })}>
                  <Plus size={16} aria-hidden />
                  Create Store
                </Link>
              )
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {stores.map((store) => (
              <li key={store._id}>
                <Card padding="md" className="flex flex-col gap-3">
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <StoreAvatar store={store} />
                      <span className="text-sm font-medium text-admin-text-primary truncate">{store.name}</span>
                    </div>
                    <StoreStatus active={store.isActive} />
                  </div>

                  {/* Domains */}
                  {store.domains.length > 0 && <DomainChips domains={store.domains} />}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-admin-border">
                    {store.domains[0] && (
                      <a
                        href={`http://${store.domains[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${store.name} (opens in a new tab)`}
                        className={visitClass}
                      >
                        <ExternalLink aria-hidden className="w-3.5 h-3.5" />
                        Visit
                      </a>
                    )}
                    <Link
                      href={`/admin/stores/${store._id}`}
                      aria-label={`Manage ${store.name}`}
                      className={`ml-auto ${manageClass}`}
                    >
                      <Settings aria-hidden className="w-3.5 h-3.5" />
                      Manage
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
                    <th scope="col" className={thClass}>Store</th>
                    <th scope="col" className={thClass}>Domains</th>
                    <th scope="col" className={thClass}>Status</th>
                    <th scope="col" className={`${thClass} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {stores.map((store) => (
                    <tr key={store._id} className="hover:bg-admin-surface-hover transition-colors">
                      {/* Store name + avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <StoreAvatar store={store} />
                          <span className="text-sm font-medium text-admin-text-primary">{store.name}</span>
                        </div>
                      </td>

                      {/* Domains */}
                      <td className="px-5 py-4">
                        <DomainChips domains={store.domains} />
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <StoreStatus active={store.isActive} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3">
                          {store.domains[0] && (
                            <a
                              href={`http://${store.domains[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Visit ${store.name} (opens in a new tab)`}
                              className={visitClass}
                            >
                              <ExternalLink aria-hidden className="w-3.5 h-3.5" />
                              Visit
                            </a>
                          )}
                          <Link
                            href={`/admin/stores/${store._id}`}
                            aria-label={`Manage ${store.name}`}
                            className={manageClass}
                          >
                            <Settings aria-hidden className="w-3.5 h-3.5" />
                            Manage
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

/** Store identity swatch: logo, or initials on the store's own brand colour. */
function StoreAvatar({ store }: { store: IStore }) {
  const primary = resolveTheme(store.theme).primaryColor || "#111827";
  const initials = store.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      aria-hidden
      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: primary }}
    >
      {store.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logo} alt="" className="w-full h-full object-cover rounded-lg" />
      ) : (
        initials
      )}
    </div>
  );
}

function DomainChips({ domains }: { domains: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {domains.slice(0, 2).map((domain) => (
        <span
          key={domain}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md"
        >
          <Globe aria-hidden className="w-3 h-3 shrink-0" />
          {domain}
        </span>
      ))}
      {domains.length > 2 && (
        <span className="px-2 py-0.5 bg-admin-chip text-admin-chip-text text-xs rounded-md">
          +{domains.length - 2}
        </span>
      )}
    </div>
  );
}

/** Dot + text label, so status never relies on colour alone. */
function StoreStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
        active
          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
          : "bg-admin-chip text-admin-chip-text"
      }`}
    >
      <span
        aria-hidden
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-admin-text-subtle"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

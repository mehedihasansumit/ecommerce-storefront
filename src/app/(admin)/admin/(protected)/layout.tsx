import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
  Shield,
} from "lucide-react";
import { MobileAdminNav } from "../_components/MobileAdminNav";
import { AdminLogoutButton } from "../_components/AdminLogoutButton";
import { getAdminToken, getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getAdminToken();

  if (!payload || payload.type !== "admin") {
    redirect("/admin/login");
  }

  const adminUser = await getAdminDbUser();

  const isSuperAdmin = adminUser?.role.isSuperAdmin ?? false;

  const permCtx = adminUser
    ? {
        isSuperAdmin,
        permissions: adminUser.role.permissions ?? [],
        assignedStores: adminUser.assignedStores ?? [],
      }
    : null;

  const canViewStores =
    isSuperAdmin ||
    (permCtx &&
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
        PERMISSIONS.COUPONS_VIEW,
        PERMISSIONS.ANNOUNCEMENTS_VIEW,
      ].some((p) => hasPermission(permCtx, p)));

  const canViewOrders =
    isSuperAdmin || (permCtx && hasPermission(permCtx, PERMISSIONS.ORDERS_VIEW));

  const canViewCustomers =
    isSuperAdmin || (permCtx && hasPermission(permCtx, PERMISSIONS.CUSTOMERS_VIEW));

  const navLinkClass =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors";

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className={navLinkClass}>
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          {canViewStores && (
            <Link href="/admin/stores" className={navLinkClass}>
              <Store size={18} />
              <span className="text-sm">Stores</span>
            </Link>
          )}
          {canViewOrders && (
            <Link href="/admin/orders" className={navLinkClass}>
              <ShoppingBag size={18} />
              <span className="text-sm">All Orders</span>
            </Link>
          )}
          {canViewCustomers && (
            <Link href="/admin/customers" className={navLinkClass}>
              <Users size={18} />
              <span className="text-sm">Customers</span>
            </Link>
          )}
          {isSuperAdmin && (
            <>
              <Link href="/admin/roles" className={navLinkClass}>
                <Shield size={18} />
                <span className="text-sm">Roles</span>
              </Link>
              <Link href="/admin/admins" className={navLinkClass}>
                <UserCog size={18} />
                <span className="text-sm">Admins</span>
              </Link>
            </>
          )}
        </nav>
        {adminUser && (
          <div className="p-4 border-t border-gray-800 space-y-2">
            <div>
              <p className="text-xs font-medium text-white truncate">
                {adminUser.name}
              </p>
              <p className="text-xs text-gray-400">{adminUser.role.name}</p>
            </div>
            <AdminLogoutButton />
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <MobileAdminNav
          isSuperAdmin={isSuperAdmin}
          canViewStores={!!canViewStores}
          canViewOrders={!!canViewOrders}
          canViewCustomers={!!canViewCustomers}
          adminName={adminUser?.name}
          adminRole={adminUser?.role.name}
        />
        <main className="flex-1">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

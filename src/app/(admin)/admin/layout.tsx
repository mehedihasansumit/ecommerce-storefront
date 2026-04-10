import Link from "next/link";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
} from "lucide-react";
import { MobileAdminNav } from "./_components/MobileAdminNav";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = (await getAdminToken()) as JwtAdminPayload | null;

  const isSuperAdmin = payload?.role === "superadmin";
  const canViewStores =
    isSuperAdmin ||
    (payload &&
      (hasPermission(payload, PERMISSIONS.STORES_CREATE) ||
        hasPermission(payload, PERMISSIONS.STORES_EDIT)));
  const canViewOrders =
    isSuperAdmin ||
    (payload && hasPermission(payload, PERMISSIONS.ORDERS_VIEW));
  const canViewCustomers =
    isSuperAdmin ||
    (payload && hasPermission(payload, PERMISSIONS.CUSTOMERS_VIEW));

  const navLinkClass =
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors";

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
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
            <Link href="/admin/admins" className={navLinkClass}>
              <UserCog size={18} />
              <span className="text-sm">Admins</span>
            </Link>
          )}
        </nav>
        {payload && (
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 truncate">{payload.role}</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <MobileAdminNav
          isSuperAdmin={isSuperAdmin ?? false}
          canViewStores={canViewStores ?? false}
          canViewOrders={canViewOrders ?? false}
          canViewCustomers={canViewCustomers ?? false}
        />
        <main className="flex-1">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

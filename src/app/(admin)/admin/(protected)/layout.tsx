import { redirect } from "next/navigation";
import { MobileAdminNav } from "../_components/MobileAdminNav";
import { AdminSidebar } from "../_components/AdminSidebar";
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
        PERMISSIONS.REVIEWS_VIEW,
        PERMISSIONS.REVIEWS_MODERATE,
      ].some((p) => hasPermission(permCtx, p)));

  const canViewOrders =
    isSuperAdmin || (permCtx && hasPermission(permCtx, PERMISSIONS.ORDERS_VIEW));

  const canViewCustomers =
    isSuperAdmin || (permCtx && hasPermission(permCtx, PERMISSIONS.CUSTOMERS_VIEW));

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        isSuperAdmin={isSuperAdmin}
        canViewStores={!!canViewStores}
        canViewOrders={!!canViewOrders}
        canViewCustomers={!!canViewCustomers}
        adminName={adminUser?.name}
        adminRole={adminUser?.role.name}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-admin-surface-raised dark:bg-gray-900 min-w-0">
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

import { StoreService } from "@/features/stores/service";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Package, Tag, ShoppingBag, Users, CreditCard, Ticket, Megaphone } from "lucide-react";
import StoreEditForm from "@/features/stores/components/StoreEditForm";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");

  // Must have at least one store-scoped permission to see this page
  const hasAnyAccess = [
    PERMISSIONS.STORES_EDIT,
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
  ].some((p) => hasPermission(adminUser, p));
  if (!hasAnyAccess) redirect("/admin");

  const store = await StoreService.getById(storeId);
  if (!store) notFound();

  const canEditStore = hasPermission(adminUser, PERMISSIONS.STORES_EDIT);
  const canViewProducts =
    hasPermission(adminUser, PERMISSIONS.PRODUCTS_CREATE) ||
    hasPermission(adminUser, PERMISSIONS.PRODUCTS_EDIT) ||
    hasPermission(adminUser, PERMISSIONS.PRODUCTS_DELETE);
  const canViewOrders =
    hasPermission(adminUser, PERMISSIONS.ORDERS_VIEW) ||
    hasPermission(adminUser, PERMISSIONS.ORDERS_UPDATE_STATUS);
  const canViewPayments =
    hasPermission(adminUser, PERMISSIONS.PAYMENTS_VIEW) ||
    hasPermission(adminUser, PERMISSIONS.PAYMENTS_UPDATE_STATUS) ||
    hasPermission(adminUser, PERMISSIONS.PAYMENTS_DISCOUNT);
  const canViewCustomers = hasPermission(adminUser, PERMISSIONS.CUSTOMERS_VIEW);
  const canViewCoupons = hasPermission(adminUser, PERMISSIONS.COUPONS_VIEW);
  const canViewAnnouncements = hasPermission(adminUser, PERMISSIONS.ANNOUNCEMENTS_VIEW);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-gray-500">
            {store.domains.join(", ")}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm rounded-full ${
            store.isActive
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {store.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Quick Links — only show sections the manager can access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {canViewProducts && (
          <QuickLink
            href={`/admin/stores/${storeId}/products`}
            icon={<Package size={24} />}
            label="Products"
          />
        )}
        {canEditStore && (
          <QuickLink
            href={`/admin/stores/${storeId}/categories`}
            icon={<Tag size={24} />}
            label="Categories"
          />
        )}
        {canViewOrders && (
          <QuickLink
            href={`/admin/stores/${storeId}/orders`}
            icon={<ShoppingBag size={24} />}
            label="Orders"
          />
        )}
        {canViewCustomers && (
          <QuickLink
            href={`/admin/stores/${storeId}/customers`}
            icon={<Users size={24} />}
            label="Customers"
          />
        )}
        {canViewPayments && (
          <QuickLink
            href={`/admin/stores/${storeId}/payments`}
            icon={<CreditCard size={24} />}
            label="Payments"
          />
        )}
        {canViewCoupons && (
          <QuickLink
            href={`/admin/stores/${storeId}/coupons`}
            icon={<Ticket size={24} />}
            label="Coupons"
          />
        )}
        {canViewAnnouncements && (
          <QuickLink
            href={`/admin/stores/${storeId}/announcements`}
            icon={<Megaphone size={24} />}
            label="Announcements"
          />
        )}
      </div>

      {/* Theme Preview + Edit — only for managers with stores.edit */}
      {canEditStore && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Current Theme</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorSwatch label="Primary" color={store.theme.primaryColor} />
              <ColorSwatch label="Secondary" color={store.theme.secondaryColor} />
              <ColorSwatch label="Accent" color={store.theme.accentColor} />
              <ColorSwatch label="Header BG" color={store.theme.headerBg} />
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Font: {store.theme.fontFamily} | Layout: {store.theme.layoutStyle} |
              Radius: {store.theme.borderRadius}
            </p>
          </div>
          <StoreEditForm store={store} />
        </>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
    >
      <span className="text-gray-600">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-md border border-gray-200"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-mono">{color}</p>
      </div>
    </div>
  );
}

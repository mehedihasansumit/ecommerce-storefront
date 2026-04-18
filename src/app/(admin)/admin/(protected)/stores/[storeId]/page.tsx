import { StoreService } from "@/features/stores/service";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Tag,
  ShoppingBag,
  Users,
  CreditCard,
  Ticket,
  Megaphone,
  BarChart2,
  ArrowRight,
  Globe,
  Star,
  Sparkles,
} from "lucide-react";
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
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.REVIEWS_VIEW,
    PERMISSIONS.REVIEWS_MODERATE,
    PERMISSIONS.POINTS_VIEW,
    PERMISSIONS.POINTS_MANAGE,
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
  const canViewAnalytics = hasPermission(adminUser, PERMISSIONS.ANALYTICS_VIEW);
  const canViewReviews =
    hasPermission(adminUser, PERMISSIONS.REVIEWS_VIEW) ||
    hasPermission(adminUser, PERMISSIONS.REVIEWS_MODERATE);
  const canViewPoints = hasPermission(adminUser, PERMISSIONS.POINTS_VIEW);
  const canManagePoints = hasPermission(adminUser, PERMISSIONS.POINTS_MANAGE);

  const modules = [
    canViewProducts && {
      href: `/admin/stores/${storeId}/products`,
      icon: Package,
      label: "Products",
      description: "Manage your catalog",
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    canEditStore && {
      href: `/admin/stores/${storeId}/categories`,
      icon: Tag,
      label: "Categories",
      description: "Organise product groups",
      color: "bg-amber-500",
      lightColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    canViewOrders && {
      href: `/admin/stores/${storeId}/orders`,
      icon: ShoppingBag,
      label: "Orders",
      description: "Track & fulfil orders",
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    canViewCustomers && {
      href: `/admin/stores/${storeId}/customers`,
      icon: Users,
      label: "Customers",
      description: "View customer accounts",
      color: "bg-violet-500",
      lightColor: "bg-violet-50",
      textColor: "text-violet-600",
    },
    canViewPayments && {
      href: `/admin/stores/${storeId}/payments`,
      icon: CreditCard,
      label: "Payments",
      description: "Revenue & transactions",
      color: "bg-teal-500",
      lightColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
    canViewCoupons && {
      href: `/admin/stores/${storeId}/coupons`,
      icon: Ticket,
      label: "Coupons",
      description: "Discounts & promo codes",
      color: "bg-rose-500",
      lightColor: "bg-rose-50",
      textColor: "text-rose-600",
    },
    canViewAnnouncements && {
      href: `/admin/stores/${storeId}/announcements`,
      icon: Megaphone,
      label: "Announcements",
      description: "Site-wide banners",
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    canViewAnalytics && {
      href: `/admin/stores/${storeId}/analytics`,
      icon: BarChart2,
      label: "Analytics",
      description: "Traffic & revenue insights",
      color: "bg-cyan-500",
      lightColor: "bg-cyan-50",
      textColor: "text-cyan-600",
    },
    canViewReviews && {
      href: `/admin/stores/${storeId}/reviews`,
      icon: Star,
      label: "Reviews",
      description: "Moderate customer reviews",
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    canViewPoints && {
      href: `/admin/stores/${storeId}/points`,
      icon: Sparkles,
      label: "Loyalty Points",
      description: "Balances, ledger & rules",
      color: "bg-pink-500",
      lightColor: "bg-pink-50",
      textColor: "text-pink-600",
    },
  ].filter(Boolean) as {
    href: string;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    lightColor: string;
    textColor: string;
  }[];

  const themeColors = [
    store.theme.primaryColor,
    store.theme.secondaryColor,
    store.theme.accentColor,
    store.theme.headerBg,
    store.theme.backgroundColor,
  ];

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="relative rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background: `linear-gradient(135deg, ${store.theme.primaryColor} 0%, ${store.theme.accentColor} 100%)`,
          }}
        />
        <div
          className="absolute top-0 left-0 w-1 h-full"
          style={{ backgroundColor: store.theme.primaryColor }}
        />
        <div className="relative p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm flex-shrink-0 select-none"
                style={{ backgroundColor: store.theme.primaryColor }}
              >
                {store.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{store.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <Globe size={12} className="text-gray-400" />
                  {store.domains.map((domain) => (
                    <span
                      key={domain}
                      className="text-xs px-2 py-0.5 bg-gray-100 rounded-md text-gray-500 font-mono border border-gray-200"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Theme palette */}
              {canEditStore && (
                <div className="hidden sm:flex items-center gap-1">
                  {themeColors.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  store.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    store.isActive ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                />
                {store.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {canEditStore && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
              <span className="font-medium">Theme:</span>
              <span>{store.theme.fontFamily}</span>
              <span className="text-gray-300">·</span>
              <span className="capitalize">{store.theme.layoutStyle} layout</span>
              <span className="text-gray-300">·</span>
              <span>
                {store.theme.borderRadius === "0rem"
                  ? "No radius"
                  : `${store.theme.borderRadius} radius`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Module Navigation */}
      {modules.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">
            Store Modules
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-150 hover:-translate-y-0.5"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${mod.lightColor} ${mod.textColor} flex items-center justify-center flex-shrink-0 transition-colors group-hover:${mod.color}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{mod.label}</p>
                    <p className="text-xs text-gray-400 truncate">{mod.description}</p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-gray-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Store Settings Form */}
      {(canEditStore || canManagePoints) && (
        <div id="loyalty-points">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-0.5">
            Store Settings
          </h2>
          <StoreEditForm
            store={store}
            canEditStore={canEditStore}
            canManagePoints={canManagePoints}
          />
        </div>
      )}
    </div>
  );
}

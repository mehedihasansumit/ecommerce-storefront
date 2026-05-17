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
  ExternalLink,
  Settings2,
  Type,
  RotateCcw,
  Gift,
} from "lucide-react";
import StoreEditForm from "@/features/stores/components/StoreEditForm";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";

type ModuleAccent =
  | "blue"
  | "amber"
  | "emerald"
  | "violet"
  | "teal"
  | "rose"
  | "orange"
  | "cyan"
  | "yellow"
  | "pink";

const ACCENTS: Record<
  ModuleAccent,
  { idle: string; hover: string; ring: string; bar: string }
> = {
  blue: {
    idle: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    hover: "group-hover:bg-blue-600 group-hover:text-white",
    ring: "group-hover:ring-blue-200 dark:group-hover:ring-blue-900",
    bar: "bg-blue-500",
  },
  amber: {
    idle: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    hover: "group-hover:bg-amber-500 group-hover:text-white",
    ring: "group-hover:ring-amber-200 dark:group-hover:ring-amber-900",
    bar: "bg-amber-500",
  },
  emerald: {
    idle:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    hover: "group-hover:bg-emerald-600 group-hover:text-white",
    ring: "group-hover:ring-emerald-200 dark:group-hover:ring-emerald-900",
    bar: "bg-emerald-500",
  },
  violet: {
    idle:
      "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
    hover: "group-hover:bg-violet-600 group-hover:text-white",
    ring: "group-hover:ring-violet-200 dark:group-hover:ring-violet-900",
    bar: "bg-violet-500",
  },
  teal: {
    idle: "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
    hover: "group-hover:bg-teal-600 group-hover:text-white",
    ring: "group-hover:ring-teal-200 dark:group-hover:ring-teal-900",
    bar: "bg-teal-500",
  },
  rose: {
    idle: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    hover: "group-hover:bg-rose-600 group-hover:text-white",
    ring: "group-hover:ring-rose-200 dark:group-hover:ring-rose-900",
    bar: "bg-rose-500",
  },
  orange: {
    idle:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    hover: "group-hover:bg-orange-500 group-hover:text-white",
    ring: "group-hover:ring-orange-200 dark:group-hover:ring-orange-900",
    bar: "bg-orange-500",
  },
  cyan: {
    idle: "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
    hover: "group-hover:bg-cyan-600 group-hover:text-white",
    ring: "group-hover:ring-cyan-200 dark:group-hover:ring-cyan-900",
    bar: "bg-cyan-500",
  },
  yellow: {
    idle:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-500",
    hover: "group-hover:bg-yellow-500 group-hover:text-white",
    ring: "group-hover:ring-yellow-200 dark:group-hover:ring-yellow-900",
    bar: "bg-yellow-500",
  },
  pink: {
    idle: "bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
    hover: "group-hover:bg-pink-600 group-hover:text-white",
    ring: "group-hover:ring-pink-200 dark:group-hover:ring-pink-900",
    bar: "bg-pink-500",
  },
};

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
    PERMISSIONS.CAMPAIGNS_VIEW,
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
  const canViewRefunds = hasPermission(adminUser, PERMISSIONS.REFUNDS_VIEW);
  const canViewCampaigns = hasPermission(adminUser, PERMISSIONS.CAMPAIGNS_VIEW);

  const modules = [
    canViewProducts && {
      href: `/admin/stores/${storeId}/products`,
      icon: Package,
      label: "Products",
      description: "Manage your catalog",
      accent: "blue" as ModuleAccent,
    },
    canEditStore && {
      href: `/admin/stores/${storeId}/categories`,
      icon: Tag,
      label: "Categories",
      description: "Organise product groups",
      accent: "amber" as ModuleAccent,
    },
    canViewOrders && {
      href: `/admin/stores/${storeId}/orders`,
      icon: ShoppingBag,
      label: "Orders",
      description: "Track & fulfil orders",
      accent: "emerald" as ModuleAccent,
    },
    canViewCustomers && {
      href: `/admin/stores/${storeId}/customers`,
      icon: Users,
      label: "Customers",
      description: "View customer accounts",
      accent: "violet" as ModuleAccent,
    },
    canViewPayments && {
      href: `/admin/stores/${storeId}/payments`,
      icon: CreditCard,
      label: "Payments",
      description: "Revenue & transactions",
      accent: "teal" as ModuleAccent,
    },
    canViewCoupons && {
      href: `/admin/stores/${storeId}/coupons`,
      icon: Ticket,
      label: "Coupons",
      description: "Discounts & promo codes",
      accent: "rose" as ModuleAccent,
    },
    canViewCampaigns && {
      href: `/admin/stores/${storeId}/campaigns`,
      icon: Gift,
      label: "Campaigns",
      description: "BOGO, bundles & free gifts",
      accent: "violet" as ModuleAccent,
    },
    canViewAnnouncements && {
      href: `/admin/stores/${storeId}/announcements`,
      icon: Megaphone,
      label: "Announcements",
      description: "Site-wide banners",
      accent: "orange" as ModuleAccent,
    },
    canViewAnalytics && {
      href: `/admin/stores/${storeId}/analytics`,
      icon: BarChart2,
      label: "Analytics",
      description: "Traffic & revenue insights",
      accent: "cyan" as ModuleAccent,
    },
    canViewReviews && {
      href: `/admin/stores/${storeId}/reviews`,
      icon: Star,
      label: "Reviews",
      description: "Moderate customer reviews",
      accent: "yellow" as ModuleAccent,
    },
    canViewPoints && {
      href: `/admin/stores/${storeId}/points`,
      icon: Sparkles,
      label: "Loyalty Points",
      description: "Balances, ledger & rules",
      accent: "pink" as ModuleAccent,
    },
    canViewRefunds && {
      href: `/admin/stores/${storeId}/refunds`,
      icon: RotateCcw,
      label: "Refunds",
      description: "Manage refund requests",
      accent: "rose" as ModuleAccent,
    },
  ].filter(Boolean) as {
    href: string;
    icon: React.ElementType;
    label: string;
    description: string;
    accent: ModuleAccent;
  }[];

  const lightColors = [
    store.theme.primaryColor,
    store.theme.secondaryColor,
    store.theme.accentColor,
    store.theme.headerBg,
    store.theme.backgroundColor,
  ];

  const darkColors = store.theme.dark
    ? [
        store.theme.dark.backgroundColor,
        store.theme.dark.primaryColor ?? store.theme.primaryColor,
        store.theme.dark.surfaceColor,
        store.theme.dark.headerBg,
      ].filter(Boolean)
    : [];

  const primaryDomain = store.domains[0];
  const storefrontUrl = primaryDomain
    ? primaryDomain.startsWith("http")
      ? primaryDomain
      : `https://${primaryDomain}`
    : null;

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <div className="relative rounded-2xl overflow-hidden bg-admin-surface border border-admin-border-md shadow-sm">
        <div
          className="absolute inset-0 opacity-[0.07]"
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
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0 select-none ring-4 ring-white/30 dark:ring-black/20"
                style={{ backgroundColor: store.theme.primaryColor }}
              >
                {store.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-admin-text-primary leading-tight tracking-tight truncate">
                  {store.name}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <Globe size={12} className="text-admin-text-subtle" />
                  {store.domains.map((domain) => (
                    <span
                      key={domain}
                      className="text-xs px-2 py-0.5 bg-admin-chip rounded-md text-admin-text-muted font-mono border border-admin-border-md"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  store.isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                    : "bg-admin-chip text-admin-text-muted border border-admin-border-md"
                }`}
              >
                <span className="relative flex w-2 h-2">
                  {store.isActive && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
                  )}
                  <span
                    className={`relative w-2 h-2 rounded-full ${
                      store.isActive ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                </span>
                {store.isActive ? "Active" : "Inactive"}
              </span>

              {storefrontUrl && (
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-admin-surface border border-admin-border-md text-admin-text-secondary hover:text-admin-text-primary hover:border-admin-text-subtle transition-colors"
                >
                  <ExternalLink size={13} />
                  Visit storefront
                </a>
              )}
            </div>
          </div>

          {canEditStore && (
            <div className="mt-5 pt-4 border-t border-admin-border flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-admin-text-subtle">
              {/* Theme palette */}
              <div className="inline-flex items-center gap-2">
                <span className="font-medium text-admin-text-muted">Light</span>
                <div className="flex items-center -space-x-1">
                  {lightColors.map((color, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full border-2 border-white dark:border-admin-surface shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {darkColors.length > 0 && (
                <div className="inline-flex items-center gap-2">
                  <span className="font-medium text-admin-text-muted">Dark</span>
                  <div className="flex items-center -space-x-1">
                    {darkColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full border-2 border-white dark:border-admin-surface shadow-sm"
                        style={{ backgroundColor: color as string }}
                        title={`dark: ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              <span className="hidden md:inline text-admin-border-md">·</span>

              <span className="inline-flex items-center gap-1.5">
                <Type size={12} />
                {store.theme.fontFamily}
              </span>
              <span className="capitalize">{store.theme.layoutStyle} layout</span>
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
          <div className="flex items-center justify-between mb-3 px-0.5">
            <h2 className="text-xs font-semibold text-admin-text-subtle uppercase tracking-wider">
              Store Modules
            </h2>
            <span className="text-xs text-admin-text-subtle">
              {modules.length} available
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {modules.map((mod) => {
              const Icon = mod.icon;
              const a = ACCENTS[mod.accent];
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`group relative overflow-hidden flex items-center gap-3 p-4 bg-admin-surface rounded-xl border border-admin-border-md ring-2 ring-transparent ${a.ring} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-[var(--ease-out-expo)]`}
                >
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1 ${a.bar} opacity-0 group-hover:opacity-100 transition-opacity`}
                  />
                  <div
                    className={`w-10 h-10 rounded-lg ${a.idle} ${a.hover} flex items-center justify-center flex-shrink-0 transition-colors duration-200`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-admin-text-secondary truncate">
                      {mod.label}
                    </p>
                    <p className="text-xs text-admin-text-subtle truncate">
                      {mod.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-admin-text-subtle flex-shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
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
          <h2 className="text-xs font-semibold text-admin-text-subtle uppercase tracking-wider mb-3 px-0.5 inline-flex items-center gap-1.5">
            <Settings2 size={12} />
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


import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
  Shield,
  HardDrive,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavPermissions {
  isSuperAdmin: boolean;
  canViewStores: boolean;
  canViewOrders: boolean;
  canViewCustomers: boolean;
}

export interface AdminNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

/** Single source of truth for the admin sidebar (desktop) and drawer (mobile). */
export function getAdminNavItems(p: AdminNavPermissions): {
  coreItems: AdminNavItem[];
  superItems: AdminNavItem[];
} {
  const coreItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", show: true },
    { href: "/admin/stores", icon: Store, label: "Stores", show: p.canViewStores },
    { href: "/admin/orders", icon: ShoppingBag, label: "All Orders", show: p.canViewOrders },
    { href: "/admin/customers", icon: Users, label: "Customers", show: p.canViewCustomers },
  ];

  const superItems = [
    { href: "/admin/roles", icon: Shield, label: "Roles", show: p.isSuperAdmin },
    { href: "/admin/admins", icon: UserCog, label: "Admins", show: p.isSuperAdmin },
    { href: "/admin/maintenance", icon: HardDrive, label: "Storage Cleanup", show: p.isSuperAdmin },
  ];

  const visible = (items: (AdminNavItem & { show: boolean })[]) =>
    items.filter((i) => i.show).map(({ href, icon, label }) => ({ href, icon, label }));

  return { coreItems: visible(coreItems), superItems: visible(superItems) };
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

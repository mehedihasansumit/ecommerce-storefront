"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
  Shield,
} from "lucide-react";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { ThemeToggle } from "@/shared/components/ui";

interface AdminSidebarProps {
  isSuperAdmin: boolean;
  canViewStores: boolean;
  canViewOrders: boolean;
  canViewCustomers: boolean;
  adminName?: string;
  adminRole?: string;
}

export function AdminSidebar({
  isSuperAdmin,
  canViewStores,
  canViewOrders,
  canViewCustomers,
  adminName,
  adminRole,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const coreItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", show: true },
    { href: "/admin/stores", icon: Store, label: "Stores", show: canViewStores },
    { href: "/admin/orders", icon: ShoppingBag, label: "All Orders", show: canViewOrders },
    { href: "/admin/customers", icon: Users, label: "Customers", show: canViewCustomers },
  ].filter((i) => i.show);

  const superItems = [
    { href: "/admin/roles", icon: Shield, label: "Roles", show: isSuperAdmin },
    { href: "/admin/admins", icon: UserCog, label: "Admins", show: isSuperAdmin },
  ].filter((i) => i.show);

  const initials = adminName
    ? adminName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <aside className="w-60 bg-gray-950 text-white hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto shrink-0">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Logo */}
      <div className="relative px-5 py-5 border-b border-white/[0.06]">
        <Link
          href="/admin"
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/40 group-hover:shadow-indigo-800/60 transition-shadow">
            <LayoutDashboard size={15} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-white leading-none">
              Admin Panel
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 tracking-wide">
              Management Console
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="relative flex-1 px-3 py-4 overflow-y-auto">
        {/* Core section */}
        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">
          Overview
        </p>
        <div className="space-y-0.5 mb-5">
          {coreItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
                )}
                <Icon
                  size={16}
                  className={
                    active
                      ? "text-indigo-400"
                      : "text-gray-600 group-hover:text-gray-400 transition-colors"
                  }
                />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Super admin section */}
        {superItems.length > 0 && (
          <>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-600">
              Administration
            </p>
            <div className="space-y-0.5">
              {superItems.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-400" />
                    )}
                    <Icon
                      size={16}
                      className={
                        active
                          ? "text-violet-400"
                          : "text-gray-600 group-hover:text-gray-400 transition-colors"
                      }
                    />
                    <span>{label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500/80" />
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            {adminName && (
              <p className="text-[12px] font-medium text-white truncate leading-tight">
                {adminName}
              </p>
            )}
            {adminRole && (
              <p className="text-[10px] text-gray-500 capitalize truncate leading-tight mt-0.5">
                {adminRole}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle variant="sidebar" />
          <AdminLogoutButton />
        </div>
      </div>
    </aside>
  );
}

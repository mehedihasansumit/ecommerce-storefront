"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  UserCog,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/shared/components/ui";

interface MobileAdminNavProps {
  isSuperAdmin: boolean;
  canViewStores: boolean;
  canViewOrders: boolean;
  canViewCustomers: boolean;
  adminName?: string;
  adminRole?: string;
}

export function MobileAdminNav({
  isSuperAdmin,
  canViewStores,
  canViewOrders,
  canViewCustomers,
  adminName,
  adminRole,
}: MobileAdminNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
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
    <div className="md:hidden">
      {/* Top bar */}
      <header className="bg-gray-950 text-white border-b border-white/[0.06] flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
            <LayoutDashboard size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Admin Panel</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-admin-surface/[0.07] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Drawer overlay + panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-in panel */}
          <nav
            className="absolute left-0 top-0 h-full w-72 bg-gray-950 text-white flex flex-col animate-slide-in-right shadow-2xl shadow-black/60"
            style={{ animationDirection: "normal" }}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
          >
            {/* Subtle grid texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Header */}
            <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                  <LayoutDashboard size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-none">Admin Panel</p>
                  <p className="text-[10px] text-admin-text-muted mt-0.5">Management Console</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-admin-surface/[0.07] transition-colors text-admin-text-subtle hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <div className="relative flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-admin-text-secondary">
                Overview
              </p>
              <div className="space-y-0.5 mb-5">
                {coreItems.map(({ href, icon: Icon, label }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                        active
                          ? "bg-admin-surface/[0.08] text-white"
                          : "text-admin-text-subtle hover:text-gray-100 hover:bg-admin-surface/[0.05]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400" />
                      )}
                      <Icon
                        size={16}
                        className={active ? "text-indigo-400" : "text-admin-text-secondary group-hover:text-admin-text-subtle transition-colors"}
                      />
                      <span>{label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500/80" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {superItems.length > 0 && (
                <>
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-admin-text-secondary">
                    Administration
                  </p>
                  <div className="space-y-0.5">
                    {superItems.map(({ href, icon: Icon, label }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setIsOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                            active
                              ? "bg-admin-surface/[0.08] text-white"
                              : "text-admin-text-subtle hover:text-gray-100 hover:bg-admin-surface/[0.05]"
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-violet-400" />
                          )}
                          <Icon
                            size={16}
                            className={active ? "text-violet-400" : "text-admin-text-secondary group-hover:text-admin-text-subtle transition-colors"}
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
            </div>

            {/* User footer */}
            <div className="relative px-3 pb-4 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-admin-surface/[0.04] mb-1">
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
                    <p className="text-[10px] text-admin-text-muted capitalize truncate leading-tight mt-0.5">
                      {adminRole}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle variant="sidebar" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 flex-1 px-3 py-2 rounded-lg text-admin-text-subtle hover:text-red-400 hover:bg-red-950/30 transition-all text-[13px] font-medium"
                >
                  <LogOut size={15} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

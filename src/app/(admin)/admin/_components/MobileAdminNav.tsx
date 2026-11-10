"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/shared/components/ui";
import { getAdminNavItems, isAdminNavActive } from "./admin-nav";

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
  const drawerId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  // Close on route change
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  // Focus moves into the drawer on open and back to the trigger on close
  useEffect(() => {
    if (isOpen) {
      closeRef.current?.focus();
    } else if (wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Escape closes; Tab is trapped inside the modal drawer
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !drawerRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !drawerRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function isActive(href: string) {
    return isAdminNavActive(pathname, href);
  }

  async function handleLogout() {
    await fetch("/api/auth/admin-logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const { coreItems, superItems } = getAdminNavItems({
    isSuperAdmin,
    canViewStores,
    canViewOrders,
    canViewCustomers,
  });

  const initials = adminName
    ? adminName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div className="md:hidden">
      {/* Top bar */}
      <header className="bg-gray-950 text-white border-b border-white/[0.06] flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-white/[0.1] ring-1 ring-inset ring-white/[0.12] flex items-center justify-center">
            <LayoutDashboard size={14} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Admin Panel</span>
        </Link>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-lg hover:bg-white/[0.07] transition-colors focus-ring"
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls={drawerId}
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
            ref={drawerRef}
            id={drawerId}
            className="absolute left-0 top-0 h-full w-72 bg-gray-950 text-white flex flex-col animate-slide-in-left shadow-2xl shadow-black/60"
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
                <div className="w-8 h-8 rounded-lg bg-white/[0.1] ring-1 ring-inset ring-white/[0.12] flex items-center justify-center">
                  <LayoutDashboard size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-none">Admin Panel</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Management Console</p>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2.5 rounded-lg focus-ring hover:bg-white/[0.07] transition-colors text-gray-400 hover:text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav links */}
            <div className="relative flex-1 overflow-y-auto px-3 py-4">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                Overview
              </p>
              <div className="space-y-0.5 mb-5">
                {coreItems.map(({ href, icon: Icon, label }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                      )}
                      <Icon
                        size={16}
                        className={active ? "text-white" : "text-gray-400 group-hover:text-gray-200 transition-colors"}
                      />
                      <span>{label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {superItems.length > 0 && (
                <>
                  <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Administration
                  </p>
                  <div className="space-y-0.5">
                    {superItems.map(({ href, icon: Icon, label }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setIsOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                            active
                              ? "bg-white/[0.08] text-white"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                          }`}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-white" />
                          )}
                          <Icon
                            size={16}
                            className={active ? "text-white" : "text-gray-400 group-hover:text-gray-200 transition-colors"}
                          />
                          <span>{label}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
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
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.04] mb-1">
                <div className="w-7 h-7 rounded-full bg-white/[0.1] ring-1 ring-inset ring-white/[0.12] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  {adminName && (
                    <p className="text-[12px] font-medium text-white truncate leading-tight">
                      {adminName}
                    </p>
                  )}
                  {adminRole && (
                    <p className="text-[10px] text-gray-400 capitalize truncate leading-tight mt-0.5">
                      {adminRole}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle variant="sidebar" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 flex-1 px-3 py-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-950/30 transition-all text-[13px] font-medium"
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

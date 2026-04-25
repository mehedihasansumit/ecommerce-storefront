"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  LayoutGrid,
  Search,
  ShoppingCart,
  User,
  X,
  Package,
  MapPin,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/shared/context/CartContext";

export function MobileBottomNav() {
  const t = useTranslations("header");
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/customer")
      .then((r) => r.json())
      .then((data) => {
        setUserEmail(data.user?.email ?? null);
        setUserName(data.user?.name ?? null);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setAccountSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setAccountSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  async function handleLogout() {
    setAccountSheetOpen(false);
    await fetch("/api/auth/logout", { method: "POST" });
    setUserEmail(null);
    setUserName(null);
    router.push("/");
    router.refresh();
  }

  function getInitials(name: string) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
  }

  const userLoggedIn = !!userEmail;

  const tabs = [
    {
      id: "home",
      icon: Home,
      label: t("home"),
      href: "/",
      isActive: pathname === "/",
    },
    {
      id: "products",
      icon: LayoutGrid,
      label: t("products"),
      href: "/products",
      isActive: pathname.startsWith("/products"),
    },
    {
      id: "search",
      icon: Search,
      label: "Search",
      href: null,
      isActive: searchOpen,
    },
    {
      id: "cart",
      icon: ShoppingCart,
      label: t("cart"),
      href: "/cart",
      isActive: pathname === "/cart",
    },
    {
      id: "account",
      icon: User,
      label: userLoggedIn ? t("account") : t("login"),
      href: userLoggedIn ? null : "/account/login",
      isActive: pathname.startsWith("/account") || accountSheetOpen,
    },
  ];

  const accountMenuItems = [
    { href: "/account",           icon: User,    label: t("myAccount") },
    { href: "/orders",            icon: Package, label: t("myOrders")  },
    { href: "/account/addresses", icon: MapPin,  label: t("addresses") },
  ];

  return (
    <>
      {/* Search bar */}
      {searchOpen && (
        <div
          className="fixed inset-x-0 z-[49] animate-slide-down md:hidden"
          style={{
            bottom: "56px",
            backgroundColor: "var(--color-header-bg)",
            color: "var(--color-header-text)",
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3">
            <Search size={16} className="shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm text-inherit placeholder:text-white/40 focus:outline-none focus:bg-white/15 focus:border-white/30 transition-all"
            />
            {searchQuery ? (
              <button
                type="submit"
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors shrink-0"
              >
                Go
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Account bottom sheet */}
      {accountSheetOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setAccountSheetOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl animate-slide-up pb-[calc(env(safe-area-inset-bottom)+4rem)]"
            style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-text)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border-subtle" />
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 select-none"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {userName ? getInitials(userName) : <User size={18} />}
              </div>
              <div className="min-w-0">
                {userName && (
                  <p className="font-semibold text-sm text-[var(--color-text)] truncate">{userName}</p>
                )}
                <p className="text-xs text-text-tertiary truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => setAccountSheetOpen(false)}
                className="ml-auto p-1.5 rounded-lg hover:bg-surface transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={16} className="text-text-tertiary" />
              </button>
            </div>

            {/* Menu items */}
            <nav className="py-2">
              {accountMenuItems.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface transition-colors"
                  onClick={() => setAccountSheetOpen(false)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)" }}
                  >
                    <Icon size={16} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
                  <ChevronRight size={15} className="ml-auto text-text-tertiary" />
                </Link>
              ))}

              <hr className="my-1 border-border-subtle mx-5" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-5 py-3.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-950/30">
                  <LogOut size={16} className="text-red-500" />
                </div>
                <span className="text-sm font-medium text-red-500">{t("logout")}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-white/15"
        style={{
          backgroundColor: "var(--color-header-bg)",
          color: "var(--color-header-text)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const content = (
              <>
                <div className="relative">
                  <Icon size={20} />
                  {tab.id === "cart" && itemCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none mt-1 w-full text-center truncate px-1">
                  {tab.label}
                </span>
              </>
            );

            const baseClass =
              "flex flex-1 min-w-0 overflow-hidden flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150";
            const style = {
              color: tab.isActive ? "var(--color-accent)" : undefined,
              opacity: tab.isActive ? 1 : 0.55,
            };

            // Search tab
            if (tab.id === "search") {
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={baseClass}
                  style={style}
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Search"
                >
                  {content}
                </button>
              );
            }

            // Account tab — sheet when logged in, navigate when not
            if (tab.id === "account") {
              if (userLoggedIn) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={baseClass}
                    style={style}
                    onClick={() => setAccountSheetOpen((v) => !v)}
                    aria-label="Account"
                  >
                    {content}
                  </button>
                );
              }
            }

            // Regular nav link
            return (
              <Link key={tab.id} href={tab.href!} className={baseClass} style={style}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

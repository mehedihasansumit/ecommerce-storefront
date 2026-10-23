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
  Truck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "@/shared/context/CartContext";
import { formatNumber } from "@/shared/lib/i18n";

export function MobileBottomNav() {
  const t = useTranslations("header");
  const locale = useLocale();
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

  // Close sheets on navigation (render-phase reset instead of an effect cascade).
  const [sheetPath, setSheetPath] = useState(pathname);
  if (sheetPath !== pathname) {
    setSheetPath(pathname);
    setSearchOpen(false);
    setSearchQuery("");
    setAccountSheetOpen(false);
  }

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
      label: t("search"),
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
    userLoggedIn
      ? {
          id: "account",
          icon: User,
          label: t("account"),
          href: null,
          isActive:
            pathname.startsWith("/account") || accountSheetOpen,
        }
      : {
          id: "track",
          icon: Truck,
          label: t("trackShort"),
          href: "/orders/track",
          isActive: pathname.startsWith("/orders/track"),
        },
  ];

  const accountMenuItems = [
    { href: "/account",           icon: User,    label: t("myAccount") },
    { href: "/orders",            icon: Package, label: t("myOrders")  },
    { href: "/orders/track",      icon: Truck,   label: t("trackOrder") },
    { href: "/account/addresses", icon: MapPin,  label: t("addresses") },
  ];

  return (
    <>
      {/* Search bar */}
      {searchOpen && (
        <div
          className="fixed inset-x-0 z-[49] animate-slide-down md:hidden"
          style={{
            bottom: "calc(56px + env(safe-area-inset-bottom))",
            backgroundColor: "var(--color-header-bg)",
            color: "var(--color-header-text)",
            borderTop: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
          }}
        >
          <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3">
            <Search size={16} aria-hidden className="shrink-0 opacity-70" />
            <input
              ref={searchInputRef}
              type="search"
              enterKeyHint="search"
              aria-label={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 min-h-11 bg-current/10 border border-current/40 rounded-xl px-3 py-2 text-base text-inherit placeholder:text-current/70 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-header-text)] focus:bg-current/15 transition-colors"
            />
            {searchQuery ? (
              <button
                type="submit"
                className="min-h-11 text-sm font-semibold px-4 rounded-xl bg-current/15 hover:bg-current/15 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-header-text)]"
              >
                {t("searchGo")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-current/10 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-header-text)]"
                aria-label={t("closeSearch")}
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Account bottom sheet (logged-in only) */}
      {accountSheetOpen && userLoggedIn && (
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
                className="focus-ring ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-surface transition-colors shrink-0"
                aria-label={t("close")}
              >
                <X size={16} aria-hidden className="text-text-tertiary" />
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
                  <LogOut size={16} className="text-error" />
                </div>
                <span className="text-sm font-medium text-error">{t("logout")}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        aria-label={t("mobileNav")}
        className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-current/20"
        style={{
          backgroundColor: "var(--color-header-bg)",
          color: "var(--color-header-text)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch h-14">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            // Dim only icon + label on inactive tabs — the cart badge must stay full strength.
            const dim = tab.isActive ? 1 : 0.72; // ≥4.5:1 for 11px labels on light or dark bars
            const content = (
              <>
                <div className="relative">
                  <Icon size={20} aria-hidden style={{ opacity: dim }} />
                  {tab.id === "cart" && itemCount > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center leading-none ring-2"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "var(--color-on-accent, #fff)",
                        ["--tw-ring-color" as string]: "var(--color-header-bg)",
                      }}
                    >
                      {formatNumber(Math.min(itemCount, 99), locale)}{itemCount > 99 ? "+" : ""}
                    </span>
                  )}
                </div>
                <span
                  className="text-[11px] font-medium leading-none mt-1 w-full text-center truncate px-1"
                  style={{ opacity: dim }}
                >
                  {tab.label}
                </span>
              </>
            );

            const baseClass =
              "flex flex-1 min-w-0 overflow-hidden flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150";
            const style = {
              color: tab.isActive ? "var(--color-accent)" : undefined,
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
                  aria-label={t("search")}
                  aria-expanded={searchOpen}
                >
                  {content}
                </button>
              );
            }

            // Account tab — opens sheet (logged-in: menu, logged-out: track + login)
            if (tab.id === "account") {
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={baseClass}
                  style={style}
                  onClick={() => setAccountSheetOpen((v) => !v)}
                  aria-label={t("account")}
                  aria-expanded={accountSheetOpen}
                >
                  {content}
                </button>
              );
            }

            // Regular nav link
            return (
              <Link
                key={tab.id}
                href={tab.href!}
                className={baseClass}
                style={style}
                aria-current={tab.isActive ? "page" : undefined}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

"use client";

import Link from "next/link";
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  Package,
  MapPin,
} from "lucide-react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { StoreImage } from "@/shared/components/ui";
import { useTenant } from "@/shared/hooks/useTenant";
import { useCart } from "@/shared/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { ThemeToggle } from "@/shared/components/ui";

export function Header() {
  const tenant = useTenant();
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("header");
  const locale = useLocale();
  const isBn = locale === "bn";

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
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserEmail(null);
    setUserName(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : ""
      }`}
      style={{
        backgroundColor: scrolled
          ? "color-mix(in srgb, var(--color-header-bg) 85%, transparent)"
          : "var(--color-header-bg)",
        color: "var(--color-header-text)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[4rem] md:h-[4.5rem]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 min-w-0 group"
          >
            {tenant?.logo ? (
              <StoreImage
                src={tenant.logo}
                alt={tenant.name}
                width={160}
                height={40}
                priority
                sizes="160px"
                className="h-7 md:h-8 w-auto max-w-[120px] sm:max-w-none transition-transform duration-200 group-hover:scale-105"
              />
            ) : (
              <span className="text-base sm:text-xl font-bold tracking-tight truncate max-w-[140px] sm:max-w-none">
                {tenant?.name || t("storeName")}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { href: "/", label: t("home") },
              { href: "/products", label: t("products") },
            ].map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 font-medium transition-all duration-200 rounded-md ${isBn ? "text-[15px]" : "text-[13px] uppercase tracking-widest"} ${isActive ? "opacity-100" : "opacity-55 hover:opacity-90 hover:bg-white/[0.07]"}`}
                >
                  {link.label}
                  <span
                    className="absolute bottom-1 left-3 right-3 h-[2px] rounded-full"
                    style={{
                      backgroundColor: "var(--color-accent)",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "center",
                      transition: "opacity 200ms, transform 200ms cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />

            <ThemeToggle variant="header" />

            {/* Notifications (logged in only) */}
            {userEmail && <NotificationBell />}

            {/* Search — desktop only */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden md:flex p-2.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Cart — desktop only */}
            <Link
              href="/cart"
              className="hidden md:flex p-2.5 rounded-lg hover:bg-white/10 transition-colors relative"
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none ring-2"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    ["--tw-ring-color" as string]: "var(--color-header-bg)",
                  }}
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>

            {/* Account — desktop only */}
            <div className="hidden sm:block relative" ref={userMenuRef}>
              {userEmail ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Account menu"
                    aria-expanded={userMenuOpen}
                  >
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white select-none"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {userName
                        ? userName.charAt(0).toUpperCase()
                        : userEmail.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-52 border border-border-subtle shadow-lg rounded-xl py-2 z-50 animate-scale-in"
                      style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-text)" }}
                    >
                      <div className="px-4 py-2.5 border-b border-border-subtle">
                        {userName && (
                          <p className="text-sm font-medium text-[var(--color-text)] truncate">{userName}</p>
                        )}
                        <p className="text-xs text-text-tertiary truncate">{userEmail}</p>
                      </div>
                      <Link
                        href="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                      >
                        <User size={15} className="text-text-tertiary" />
                        {t("myAccount")}
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                      >
                        <Package size={15} className="text-text-tertiary" />
                        {t("myOrders") || "My Orders"}
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                      >
                        <MapPin size={15} className="text-text-tertiary" />
                        {t("addresses") || "Addresses"}
                      </Link>
                      <hr className="my-1 border-border-subtle" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut size={15} />
                        {t("logout") || "Logout"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/account/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <User size={18} />
                  <span className="hidden lg:inline">{t("login") || "Login"}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar dropdown — desktop only */}
        {searchOpen && (
          <div className="hidden md:block pb-4 animate-slide-down">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder") || "Search products..."}
                className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-white/10 border border-white/15 text-inherit placeholder:text-white/40 focus:outline-none focus:bg-white/14 focus:border-white/35 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 transition-colors"
                >
                  Go
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

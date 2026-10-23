"use client";

import Link from "next/link";
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  Package,
  MapPin,
  LogIn,
  Truck,
} from "lucide-react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { StoreImage, Avatar, type AvatarPosition } from "@/shared/components/ui";
import { useTenant } from "@/shared/hooks/useTenant";
import { useCart } from "@/shared/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { ThemeToggle } from "@/shared/components/ui";
import { formatNumber } from "@/shared/lib/i18n";

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
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userAvatarPos, setUserAvatarPos] = useState<AvatarPosition | null>(null);
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
        setUserAvatar(data.user?.avatarUrl ?? null);
        setUserAvatarPos(data.user?.avatarPosition ?? null);
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
    setUserAvatar(null);
    setUserAvatarPos(null);
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

  // Close/clear search on navigation (render-phase reset, no effect cascade).
  const [searchPath, setSearchPath] = useState(pathname);
  if (searchPath !== pathname) {
    setSearchPath(pathname);
    setSearchOpen(false);
    setSearchQuery("");
  }

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
      className={`sticky top-0 z-50 border-b border-current/10 transition-all duration-300 ${
        scrolled ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : ""
      }`}
      style={{
        // Opaque even when scrolled: a translucent bar let page text show through
        // the logo and nav while scrolling.
        backgroundColor: "var(--color-header-bg)",
        color: "var(--color-header-text)",
        ["--focus-ring" as string]: "var(--color-header-text)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-[4rem] md:h-[4.5rem]">
          {/* Logo */}
          <Link
            href="/"
            className="focus-ring flex min-h-10 min-w-0 shrink items-center gap-2 group"
          >
            {tenant?.logo ? (
              tenant.logoDark ? (
                <>
                  <StoreImage
                    src={tenant.logo}
                    alt={tenant.name}
                    width={200}
                    height={50}
                    // priority
                    // sizes="160px"
                    className="block dark:hidden w-14 md:w-16 transition-transform duration-200 group-hover:scale-105"
                  />
                  <StoreImage
                    src={tenant.logoDark}
                    alt={tenant.name}
                    width={200}
                    height={50}
                    // priority
                    // sizes="160px"
                    className="hidden dark:block w-14 md:w-16 transition-transform duration-200 group-hover:scale-105"
                  />
                </>
              ) : (
                <StoreImage
                  src={tenant.logo}
                  alt={tenant.name}
                  width={200}
                  height={50}
                  // priority
                  // sizes="160px"
                  className="w-14 md:w-16 transition-transform duration-200 group-hover:scale-105"
                />
              )
            ) : (
              <span className="font-display text-[1.0625rem] min-[360px]:text-lg sm:text-2xl font-semibold tracking-tight truncate">
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
                  aria-current={isActive ? "page" : undefined}
                  className={`focus-ring relative px-4 py-2 font-medium transition-all duration-200 rounded-md ${isBn ? "text-[15px]" : "text-[13px] uppercase tracking-widest"} ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100 hover:bg-current/10"}`}
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
          <div className="flex shrink-0 items-center gap-0.5 min-[360px]:gap-1">
            <LanguageSwitcher />

            <ThemeToggle variant="header" />

            {/* Notifications (logged in only) */}
            {userEmail && <NotificationBell />}

            {/* Search — desktop only */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="focus-ring hidden md:flex min-h-10 min-w-10 items-center justify-center p-2.5 rounded-lg hover:bg-current/10 transition-colors"
              aria-label={t("searchPlaceholder")}
              aria-expanded={searchOpen}
            >
              <Search size={18} />
            </button>

            {/* Cart — desktop only */}
            <Link
              href="/cart"
              className="focus-ring hidden md:flex min-h-10 min-w-10 items-center justify-center p-2.5 rounded-lg hover:bg-current/10 transition-colors relative"
              aria-label={itemCount > 0 ? `${t("cart")} (${formatNumber(itemCount, locale)})` : t("cart")}
            >
              <ShoppingCart size={18} />
              {itemCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center leading-none ring-2"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-on-accent, #fff)",
                    ["--tw-ring-color" as string]: "var(--color-header-bg)",
                  }}
                >
                  {formatNumber(Math.min(itemCount, 99), locale)}{itemCount > 99 ? "+" : ""}
                </span>
              )}
            </Link>

            {/* Account — desktop only when logged in; logged-out shows on mobile too */}
            <div className={`${userEmail ? "hidden sm:block" : "block"} relative`} ref={userMenuRef}>
              {userEmail ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="focus-ring flex min-h-10 min-w-10 items-center justify-center gap-1.5 p-1.5 rounded-lg hover:bg-current/10 transition-colors"
                    aria-label={t("myAccount")}
                    aria-expanded={userMenuOpen}
                  >
                    <Avatar
                      src={userAvatar}
                      position={userAvatarPos}
                      name={userName || userEmail}
                      size="sm"
                    />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-52 border border-border-subtle shadow-lg rounded-xl py-2 z-50 animate-scale-in"
                      style={{
                        backgroundColor: "var(--color-card-bg)",
                        color: "var(--color-text)",
                        ["--focus-ring" as string]: "var(--color-primary)",
                      }}
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
                        {t("myOrders")}
                      </Link>
                      <Link
                        href="/orders/track"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                      >
                        <Truck size={15} aria-hidden className="text-text-tertiary" />
                        {t("trackOrder")}
                      </Link>
                      <Link
                        href="/account/addresses"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface transition-colors"
                      >
                        <MapPin size={15} className="text-text-tertiary" />
                        {t("addresses")}
                      </Link>
                      <hr className="my-1 border-border-subtle" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-error hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <LogOut size={15} />
                        {t("logout")}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/orders/track"
                    className="focus-ring hidden lg:flex min-h-10 items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors text-sm font-medium"
                  >
                    <Truck size={16} aria-hidden />
                    <span>{t("trackOrder")}</span>
                  </Link>
                  <Link
                    href="/account/login"
                    className="focus-ring flex min-h-10 min-w-10 items-center justify-center gap-1.5 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors text-sm font-medium"
                    aria-label={t("login")}
                  >
                    <LogIn size={18} aria-hidden />
                    <span className="hidden lg:inline">{t("login")}</span>
                  </Link>
                </div>
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
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="w-full min-h-11 pl-10 pr-20 py-2.5 rounded-lg bg-current/10 border border-current/30 text-inherit placeholder:text-current/70 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-ring)] focus:bg-current/15 transition-colors text-sm"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 min-h-8 text-xs font-semibold px-3 rounded-md bg-current/15 hover:bg-current/25 transition-colors"
                >
                  {t("searchGo")}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

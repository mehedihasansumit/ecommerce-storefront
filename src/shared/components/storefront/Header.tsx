"use client";

import Link from "next/link";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Package,
  MapPin,
} from "lucide-react";
import { useTenant } from "@/shared/hooks/useTenant";
import { useCart } from "@/shared/context/CartContext";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

export function Header() {
  const tenant = useTenant();
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // Close user menu on outside click
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

  // Close mobile menu on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
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
    <>
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
          <div className="flex items-center justify-between h-[4.5rem]">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0 min-w-0 group"
            >
              {tenant?.logo ? (
                <img
                  src={tenant.logo}
                  alt={tenant.name}
                  className="h-8 w-auto max-w-[120px] sm:max-w-none transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <span className="text-lg sm:text-xl font-bold tracking-tight truncate max-w-[140px] sm:max-w-none">
                  {tenant?.name || t("storeName")}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-0.5">
              {[
                { href: "/", label: t("home") },
                { href: "/products", label: t("products") },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 font-medium transition-colors hover:bg-white/8 rounded-lg ${isBn ? "text-[15px]" : "text-[13px] uppercase tracking-widest"}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2.5 rounded-lg hover:bg-white/10 transition-colors relative"
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

              {/* Account */}
              <div className="hidden sm:block relative" ref={userMenuRef}>
                {userEmail ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Account menu"
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
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white text-gray-800 shadow-[var(--shadow-lg)] border border-gray-100 rounded-xl py-2 z-50 animate-scale-in">
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          {userName && (
                            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
                          )}
                          <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                        </div>
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <User size={15} className="text-gray-400" />
                          {t("myAccount")}
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Package size={15} className="text-gray-400" />
                          {t("myOrders") || "My Orders"}
                        </Link>
                        <Link
                          href="/account/addresses"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <MapPin size={15} className="text-gray-400" />
                          {t("addresses") || "Addresses"}
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Search bar dropdown */}
          {searchOpen && (
            <div className="pb-4 animate-slide-down">
              <form onSubmit={handleSearch} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder") || "Search products..."}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white/12 border border-white/15 text-inherit placeholder:text-white/50 focus:outline-none focus:bg-white/15 focus:border-white/40 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation - Slide-in overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <nav
            className="absolute right-0 top-0 h-full w-80 shadow-2xl animate-slide-in-right flex flex-col"
            style={{ backgroundColor: "var(--color-header-bg)", color: "var(--color-header-text)" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold text-lg">
                {tenant?.name || t("storeName")}
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 py-4 flex flex-col">
              {[
                { href: "/", label: t("home") },
                { href: "/products", label: t("products") },
                { href: "/cart", label: t("cart") || "Cart" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="font-medium">{link.label}</span>
                  <ChevronRight size={16} className="opacity-50" />
                </Link>
              ))}
              {userEmail ? (
                <>
                  <div className="px-6 py-3 border-b border-white/10">
                    <p className="text-sm font-medium truncate">{userName || userEmail}</p>
                    {userName && <p className="text-xs opacity-60 truncate">{userEmail}</p>}
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="font-medium">{t("myAccount")}</span>
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="font-medium">{t("myOrders") || "Orders"}</span>
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <Link
                    href="/account/addresses"
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="font-medium">{t("addresses") || "Addresses"}</span>
                    <ChevronRight size={16} className="opacity-50" />
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="flex items-center gap-2 px-6 py-3 text-red-400 hover:bg-white/10 transition-colors text-left"
                  >
                    <LogOut size={16} />
                    <span className="font-medium">{t("logout") || "Logout"}</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/account/login"
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="font-medium">{t("login") || "Login"}</span>
                  <ChevronRight size={16} className="opacity-50" />
                </Link>
              )}
              <div className="px-6 pt-4 mt-auto border-t border-white/10">
                <LanguageSwitcher />
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

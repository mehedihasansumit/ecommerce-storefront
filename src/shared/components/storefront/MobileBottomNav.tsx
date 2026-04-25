"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Home, LayoutGrid, Search, ShoppingCart, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/shared/context/CartContext";

export function MobileBottomNav() {
  const t = useTranslations("header");
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/customer")
      .then((r) => r.json())
      .then((data) => setUserLoggedIn(!!data.user?.email))
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
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
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
      href: userLoggedIn ? "/account" : "/account/login",
      isActive: pathname.startsWith("/account"),
    },
  ];

  return (
    <>
      {/* Search bar — slides up above nav */}
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
                <span className="text-[10px] font-medium leading-none mt-1 w-full text-center truncate px-1">{tab.label}</span>
              </>
            );

            const baseClass =
              "flex flex-1 min-w-0 overflow-hidden flex-col items-center justify-center gap-0.5 py-2 transition-all duration-150";
            const style = {
              color: tab.isActive ? "var(--color-accent)" : undefined,
              opacity: tab.isActive ? 1 : 0.55,
            };

            if (tab.href === null) {
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

            return (
              <Link key={tab.id} href={tab.href} className={baseClass} style={style}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

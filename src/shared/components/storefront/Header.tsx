"use client";

import Link from "next/link";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useTenant } from "@/shared/hooks/useTenant";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header() {
  const tenant = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("header");

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: "var(--color-header-bg)",
        color: "var(--color-header-text)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {tenant?.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-xl font-bold">
                {tenant?.name || t("storeName")}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              {t("home")}
            </Link>
            <Link
              href="/products"
              className="hover:opacity-80 transition-opacity"
            >
              {t("products")}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href="/products"
              className="hover:opacity-80 transition-opacity"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/cart"
              className="hover:opacity-80 transition-opacity relative"
            >
              <ShoppingCart size={20} />
            </Link>
            <Link
              href="/account/login"
              className="hover:opacity-80 transition-opacity"
            >
              <User size={20} />
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link
              href="/"
              className="block py-2 hover:opacity-80"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("home")}
            </Link>
            <Link
              href="/products"
              className="block py-2 hover:opacity-80"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("products")}
            </Link>
            <Link
              href="/account"
              className="block py-2 hover:opacity-80"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("myAccount")}
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

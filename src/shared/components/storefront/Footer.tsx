"use client";

import Link from "next/link";
import { useTenant } from "@/shared/hooks/useTenant";
import { useTranslations } from "next-intl";
import { MapPin, Mail, Phone } from "lucide-react";

const SocialIcon = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 hover:scale-105 flex items-center justify-center transition-all duration-200"
    aria-label={label}
  >
    {children}
  </a>
);

export function Footer() {
  const tenant = useTenant();
  const t = useTranslations("footer");

  const quickLinks = [
    { href: "/products", label: t("allProducts") },
    { href: "/cart", label: t("cart") },
    { href: "/account", label: t("myAccount") },
    { href: "/orders", label: t("myOrders") },
  ];

  const policyLinks = [
    t("shippingPolicy"),
    t("returnPolicy"),
    t("privacyPolicy"),
    t("termsOfService"),
  ];

  const hasSocial =
    tenant?.socialLinks?.facebook ||
    tenant?.socialLinks?.instagram ||
    tenant?.socialLinks?.twitter;

  return (
    <footer
      className="mt-auto"
      style={{
        backgroundColor: "var(--color-header-bg)",
        color: "var(--color-header-text)",
      }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Store Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-bold mb-3 tracking-tight">
              {tenant?.name || "Store"}
            </h3>
            <p className="text-sm text-white/50 mb-6 leading-relaxed max-w-xs">
              {t("storeDescription")}
            </p>

            {hasSocial && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-3">
                  {t("followUs")}
                </p>
                <div className="flex gap-2.5">
                  {tenant?.socialLinks?.facebook && (
                    <SocialIcon href={tenant.socialLinks.facebook} label="Facebook">
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </SocialIcon>
                  )}
                  {tenant?.socialLinks?.instagram && (
                    <SocialIcon href={tenant.socialLinks.instagram} label="Instagram">
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </SocialIcon>
                  )}
                  {tenant?.socialLinks?.twitter && (
                    <SocialIcon href={tenant.socialLinks.twitter} label="Twitter / X">
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </SocialIcon>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-white/40">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/55 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-white/40">
              {t("customerService")}
            </h3>
            <ul className="space-y-3 text-sm">
              {policyLinks.map((label) => (
                <li key={label}>
                  <span className="text-white/55 hover:text-white transition-colors duration-200 cursor-pointer">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-white/40">
              {t("contactUs")}
            </h3>
            <ul className="space-y-3.5 text-sm">
              {tenant?.contact?.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-white/40" />
                  <span className="text-white/55 leading-snug">{tenant.contact.address}</span>
                </li>
              )}
              {tenant?.contact?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={15} className="shrink-0 text-white/40" />
                  <a
                    href={`mailto:${tenant.contact.email}`}
                    className="text-white/55 hover:text-white transition-colors duration-200"
                  >
                    {tenant.contact.email}
                  </a>
                </li>
              )}
              {tenant?.contact?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="shrink-0 text-white/40" />
                  <a
                    href={`tel:${tenant.contact.phone}`}
                    className="text-white/55 hover:text-white transition-colors duration-200"
                  >
                    {tenant.contact.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            &copy; {new Date().getFullYear()} {tenant?.name || "Store"}.{" "}
            {t("copyright")}
          </p>

          {/* Payment method icons */}
          <div className="flex items-center gap-2">
            {/* Visa */}
            <span className="px-2 py-1 rounded bg-white/10 text-white/60 text-[10px] font-bold tracking-wide">
              VISA
            </span>
            {/* Mastercard */}
            <span className="px-2 py-1 rounded bg-white/10 flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-red-500/80 inline-block" />
              <span className="w-4 h-4 rounded-full bg-yellow-400/80 inline-block -ml-2.5" />
            </span>
            {/* bKash */}
            <span className="px-2 py-1 rounded bg-white/10 text-white/60 text-[10px] font-bold tracking-wide">
              bKash
            </span>
            {/* Nagad */}
            <span className="px-2 py-1 rounded bg-white/10 text-white/60 text-[10px] font-bold tracking-wide">
              Nagad
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

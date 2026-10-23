"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, Mail, Phone } from "lucide-react";
import { useTenant } from "@/shared/hooks/useTenant";
import { formatNumber, t as localized } from "@/shared/lib/i18n";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { StoreTrustInfo } from "./StoreTrustInfo";
import { SocialLinks } from "./SocialLinks";

/** Footer ink at a lower strength, mixed toward the footer's own ground. */
const SOFT = "color-mix(in srgb, var(--color-footer-text) 78%, var(--color-footer-bg))";

/**
 * footerStyle "wordmark" (from the taste-skill Variant): what to read next on the left,
 * how ordering works and how to reach the shop on the right, and the store's name set
 * across the full width as the close.
 */
export function WordmarkFooter() {
  const tenant = useTenant();
  const t = useTranslations("footer");
  const locale = useLocale();

  const quickLinks = [
    { href: "/products", label: t("allProducts") },
    { href: "/cart", label: t("cart") },
    { href: "/account", label: t("myAccount") },
    { href: "/orders", label: t("myOrders") },
    { href: "/orders/track", label: t("trackOrder") },
  ];

  const facts = tenant ? getStoreTrustFacts(tenant) : [];
  const name = tenant?.name || t("storeFallback");
  const description = localized(tenant?.seo?.description, locale) || t("storeDescription");

  const heading = "text-[15px] font-medium mb-4";
  const link =
    "inline-flex min-h-10 min-w-10 items-center transition-colors duration-150 hover:text-[var(--color-footer-text)]";

  return (
    <footer
      className="mt-auto overflow-hidden"
      style={{
        backgroundColor: "var(--color-footer-bg)",
        color: "var(--color-footer-text)",
        ["--focus-ring" as string]: "var(--color-footer-text)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-2 md:col-span-3 lg:col-span-4">
            <p className="text-lg md:text-xl leading-snug max-w-[28ch]">{description}</p>
            <SocialLinks
              links={tenant?.socialLinks}
              className="mt-6 flex gap-2.5"
              itemClassName="focus-ring w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--color-footer-text)_14%,transparent)]"
              itemStyle={{ backgroundColor: "color-mix(in srgb, var(--color-footer-text) 8%, transparent)" }}
              iconSize={16}
            />
          </div>

          <nav aria-labelledby="footer-shop" className="lg:col-span-2 lg:col-start-5">
            <h2 id="footer-shop" className={heading}>{t("quickLinks")}</h2>
            <ul className="text-[15px]" style={{ color: SOFT }}>
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`focus-ring ${link}`}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          {facts.length > 0 && (
            <div className="col-span-2 sm:col-span-1 lg:col-span-3">
              <h2 className={heading}>{t("ordering")}</h2>
              <div style={{ color: SOFT }}>
                <StoreTrustInfo
                  facts={facts}
                  layout="band"
                  className="flex-col !items-start !gap-y-3 !text-[15px] [&_li]:!whitespace-normal"
                />
              </div>
            </div>
          )}

          <div className="col-span-2 md:col-span-1 lg:col-span-3 lg:col-start-10">
            <h2 className={heading}>{t("contactUs")}</h2>
            <ul className="space-y-1 text-[15px]" style={{ color: SOFT }}>
              {tenant?.contact?.address && (
                <li className="flex items-start gap-2.5 py-2">
                  <MapPin size={16} aria-hidden className="shrink-0 mt-0.5" />
                  <span className="leading-snug">{tenant.contact.address}</span>
                </li>
              )}
              {tenant?.contact?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={16} aria-hidden className="shrink-0" />
                  <a href={`mailto:${tenant.contact.email}`} className={`focus-ring ${link}`}>{tenant.contact.email}</a>
                </li>
              )}
              {tenant?.contact?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={16} aria-hidden className="shrink-0" />
                  <a href={`tel:${tenant.contact.phone}`} className={`focus-ring ${link}`}>{tenant.contact.phone}</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <p className="mt-16 lg:mt-24 text-[13px]" style={{ color: SOFT }}>
          &copy; {formatNumber(new Date().getFullYear(), locale)} {name}. {t("copyright")}
        </p>
      </div>

      {/* The name returns at full width as the close. The line box leaves room under it
          for descenders, so overflow-hidden never clips a glyph. Decorative: the name is above. */}
      <p
        aria-hidden
        className="mt-6 select-none whitespace-nowrap text-center font-medium leading-none tracking-[-0.05em] pb-[0.16em]"
        style={{ fontSize: `min(19vw, ${Math.round(150 / Math.max(name.length, 6))}vw)` }}
      >
        {name}
      </p>
    </footer>
  );
}

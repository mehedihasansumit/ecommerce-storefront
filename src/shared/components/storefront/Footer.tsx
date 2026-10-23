"use client";

import Link from "next/link";
import { useTenant } from "@/shared/hooks/useTenant";
import { useLocale, useTranslations } from "next-intl";
import { Banknote, MapPin, Mail, Phone, RotateCcw, Truck } from "lucide-react";
import { getStoreTrustFacts, type StoreTrustFact } from "@/features/stores/trust";
import { formatPrice } from "@/shared/components/ui";
import { DELIVERY_CURRENCY } from "@/shared/lib/delivery";
import { formatNumber } from "@/shared/lib/i18n";
import { useStoreStyles } from "@/shared/hooks/useStoreStyles";
import { WordmarkFooter } from "./WordmarkFooter";
import { SocialLinks } from "./SocialLinks";

const FACT_ICONS = { cod: Banknote, delivery: Truck, exchange: RotateCcw } as const;

/** Storefront footer in the Store's footerStyle Style Switch. */
export function Footer() {
  const { footerStyle } = useStoreStyles();
  return footerStyle === "wordmark" ? <WordmarkFooter /> : <ColumnsFooter />;
}

/** footerStyle "columns" (base): store, quick links, ordering terms, contact. */
function ColumnsFooter() {
  const tenant = useTenant();
  const t = useTranslations("footer");
  const tr = useTranslations("trust");
  const locale = useLocale();

  const quickLinks = [
    { href: "/products", label: t("allProducts") },
    { href: "/cart", label: t("cart") },
    { href: "/account", label: t("myAccount") },
    { href: "/orders", label: t("myOrders") },
    { href: "/orders/track", label: t("trackOrder") },
  ];

  // "Shopping with us": the store's real ordering terms (COD, delivery fees, exchange
  // window) from its config. There are no policy pages to link to, so no dead links.
  const facts = tenant ? getStoreTrustFacts(tenant) : [];
  const factText = (f: StoreTrustFact) => {
    switch (f.kind) {
      case "cod":
        return tr("codLong");
      case "delivery":
        return tr("deliveryLong", {
          inside: formatPrice(f.insideDhaka, DELIVERY_CURRENCY, locale),
          outside: formatPrice(f.outsideDhaka, DELIVERY_CURRENCY, locale),
        });
      case "exchange":
        return tr("exchangeLong", { days: f.days });
    }
  };

  const hasSocial =
    tenant?.socialLinks?.facebook ||
    tenant?.socialLinks?.instagram ||
    tenant?.socialLinks?.twitter;

  return (
    <footer
      className="mt-auto"
      style={{
        backgroundColor: "var(--color-footer-bg)",
        color: "var(--color-footer-text)",
        ["--focus-ring" as string]: "var(--color-footer-text)",
      }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-current/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          {/* Store Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="font-display text-2xl font-medium mb-3 tracking-tight">
              {tenant?.name || "Store"}
            </h3>
            <p className="text-sm text-current/75 mb-6 leading-relaxed max-w-xs">
              {t("storeDescription")}
            </p>

            {hasSocial && tenant && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-current/75 mb-3">
                  {t("followUs")}
                </p>
                <SocialLinks
                  links={tenant.socialLinks}
                  className="flex gap-2.5"
                  itemClassName="w-9 h-9 rounded-full bg-current/10 hover:bg-current/15 hover:scale-105 flex items-center justify-center transition-all duration-200"
                  iconSize={15}
                />
              </>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-current/75">
              {t("quickLinks")}
            </h3>
            <ul className="-my-1.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-10 items-center text-current/75 hover:text-current transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Shopping with us: real ordering terms */}
          {facts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-current/75">
                {t("shoppingWithUs")}
              </h3>
              <ul className="space-y-3.5 text-sm">
                {facts.map((f) => {
                  const Icon = FACT_ICONS[f.kind];
                  return (
                    <li key={f.kind} className="flex items-start gap-2.5">
                      <Icon size={15} aria-hidden className="shrink-0 mt-0.5 text-current/75" />
                      <span className="text-current/75 leading-snug">{factText(f)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.15em] mb-4 text-current/75">
              {t("contactUs")}
            </h3>
            <ul className="space-y-1 text-sm">
              {tenant?.contact?.address && (
                <li className="flex items-start gap-2.5 py-2.5">
                  <MapPin size={15} aria-hidden className="shrink-0 mt-0.5 text-current/75" />
                  <span className="text-current/75 leading-snug">{tenant.contact.address}</span>
                </li>
              )}
              {tenant?.contact?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={15} aria-hidden className="shrink-0 text-current/75" />
                  <a
                    href={`mailto:${tenant.contact.email}`}
                    className="inline-flex min-h-10 items-center text-current/75 hover:text-current transition-colors duration-200"
                  >
                    {tenant.contact.email}
                  </a>
                </li>
              )}
              {tenant?.contact?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} aria-hidden className="shrink-0 text-current/75" />
                  <a
                    href={`tel:${tenant.contact.phone}`}
                    className="inline-flex min-h-10 items-center text-current/75 hover:text-current transition-colors duration-200"
                  >
                    {tenant.contact.phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-current/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-current/75">
          <p>
            &copy; {formatNumber(new Date().getFullYear(), locale)} {tenant?.name || "Store"}.{" "}
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}

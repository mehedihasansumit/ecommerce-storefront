"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/shared/components/ui";
import type { IStoreSocialOrdering } from "@/features/stores/types";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";

interface SocialOrderButtonsProps {
  socialOrdering: IStoreSocialOrdering;
  productName: string;
  productPrice: number;
  productUrl: string;
  quantity: number;
  selectedOptions: Record<string, string>;
  /** Options not chosen yet; when non-empty the links don't open and `onBlocked` fires. */
  missingOptions?: string[];
  onBlocked?: () => unknown;
}

const DEFAULT_TEMPLATE =
  "Hi, I'd like to order:\n• {{productName}}\n• Variant: {{variant}}\n• Quantity: {{quantity}}\n• Unit price: {{productPrice}}\n• Total: {{total}}\n{{productUrl}}";

export function SocialOrderButtons({
  socialOrdering,
  productName,
  productPrice,
  productUrl,
  quantity,
  selectedOptions,
  missingOptions,
  onBlocked,
}: SocialOrderButtonsProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const [copied, setCopied] = useState(false);
  const whatsapp = socialOrdering?.whatsapp;
  const facebook = socialOrdering?.facebook;

  if (!whatsapp?.enabled && !facebook?.enabled) return null;

  const variantText =
    Object.entries(selectedOptions)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ") || "-";
  const total = productPrice * quantity;

  const buildMessage = (template: string) =>
    template
      .replace(/\{\{productName\}\}/g, productName)
      .replace(/\{\{productPrice\}\}/g, formatPrice(productPrice, currency, locale))
      .replace(/\{\{productUrl\}\}/g, productUrl)
      .replace(/\{\{quantity\}\}/g, String(quantity))
      .replace(/\{\{variant\}\}/g, variantText)
      .replace(/\{\{total\}\}/g, formatPrice(total, currency, locale));

  const buildWhatsAppUrl = () => {
    const phone = whatsapp.phoneNumber.replace(/[^+\d]/g, "");
    const message = buildMessage(whatsapp.messageTemplate || DEFAULT_TEMPLATE);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // An order without a size is unusable — same rule as Add to cart.
  const guardMissingOptions = (e: React.MouseEvent) => {
    if (!missingOptions?.length) return false;
    e.preventDefault();
    onBlocked?.();
    return true;
  };

  const handleFacebookClick = async (e: React.MouseEvent) => {
    if (guardMissingOptions(e)) return;
    const message = buildMessage(whatsapp?.messageTemplate || DEFAULT_TEMPLATE);
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      // Clipboard unavailable — still open the page
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {whatsapp?.enabled && whatsapp.phoneNumber && (
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={guardMissingOptions}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2.5 border border-border-subtle bg-[var(--color-card-bg)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors duration-150 hover:bg-surface"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5 flex-shrink-0" style={{ fill: "#25D366" }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.553 4.12 1.523 5.855L.058 23.675l5.97-1.525A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.82a9.796 9.796 0 01-5.244-1.517l-.376-.224-3.898.997 1.04-3.8-.246-.39A9.773 9.773 0 012.18 12c0-5.414 4.406-9.82 9.82-9.82 5.414 0 9.82 4.406 9.82 9.82 0 5.414-4.406 9.82-9.82 9.82z" />
            </svg>
            {tr("orderViaWhatsApp")}
          </a>
        )}

        {facebook?.enabled && facebook.pageUrl && (
          <a
            href={facebook.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleFacebookClick}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2.5 border border-border-subtle bg-[var(--color-card-bg)] px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition-colors duration-150 hover:bg-surface"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <svg viewBox="0 0 24 24" aria-hidden className="w-5 h-5 flex-shrink-0" style={{ fill: "#1877F2" }}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {tr("orderViaFacebook")}
          </a>
        )}
      </div>

      {copied && (
        <p className="text-xs text-success font-medium animate-fade-in">
          {tr("orderDetailsCopied")}
        </p>
      )}
    </div>
  );
}

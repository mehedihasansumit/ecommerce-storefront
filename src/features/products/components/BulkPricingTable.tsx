"use client";

import type { IPricingTier } from "../types";
import { useLocale, useTranslations } from "next-intl";
import { normalizeTiers } from "@/shared/lib/pricing";
import { formatPrice } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import { formatNumber } from "@/shared/lib/i18n";

interface BulkPricingTableProps {
  tiers: IPricingTier[];
  basePrice: number;
  currentQuantity?: number;
  title?: string;
  perUnitLabel?: string;
  bundleLabel?: string;
  quantityLabel?: string;
}

export function BulkPricingTable({
  tiers,
  basePrice,
  currentQuantity,
  title,
  perUnitLabel,
  bundleLabel,
  quantityLabel,
}: BulkPricingTableProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const sorted = normalizeTiers(tiers);
  if (sorted.length === 0) return null;

  let activeTierQty: number | null = null;
  if (typeof currentQuantity === "number" && currentQuantity > 0) {
    for (const t of sorted) {
      if (t.quantity <= currentQuantity) activeTierQty = t.quantity;
      else break;
    }
  }

  return (
    <div
      className="border border-border-subtle p-4 space-y-3"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">
          {title ?? tr("bulkTitle")}
        </h3>
        <span className="text-xs text-text-tertiary">
          {tr("bulkBase", { price: formatPrice(basePrice, currency, locale) })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-text-tertiary uppercase tracking-wide">
        <span>{quantityLabel ?? tr("bulkBuy")}</span>
        <span className="text-right">{bundleLabel ?? tr("bulkTotal")}</span>
        <span className="text-right">{perUnitLabel ?? tr("bulkPerPiece")}</span>
      </div>
      <ul className="space-y-1.5">
        {sorted.map((tier) => {
          const perUnit = tier.totalPrice / tier.quantity;
          const isActive = activeTierQty === tier.quantity;
          return (
            <li
              key={tier.quantity}
              className={`grid grid-cols-3 gap-2 items-center py-1.5 px-2 text-sm transition-colors ${
                isActive
                  ? "bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] font-semibold"
                  : ""
              }`}
              style={{ borderRadius: "calc(var(--border-radius) - 2px)" }}
            >
              <span>{formatNumber(tier.quantity, locale)}</span>
              <span className="text-right">{formatPrice(tier.totalPrice, currency, locale)}</span>
              <span className="text-right text-text-secondary">
                {formatPrice(Math.round(perUnit * 100) / 100, currency, locale)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

"use client";

import type { IPricingTier } from "../types";
import { normalizeTiers } from "@/shared/lib/pricing";

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
  title = "Bulk Pricing",
  perUnitLabel = "per piece",
  bundleLabel = "Total",
  quantityLabel = "Buy",
}: BulkPricingTableProps) {
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
          {title}
        </h3>
        <span className="text-xs text-text-tertiary">
          base ৳{basePrice.toLocaleString()}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-text-tertiary uppercase tracking-wide">
        <span>{quantityLabel}</span>
        <span className="text-right">{bundleLabel}</span>
        <span className="text-right">{perUnitLabel}</span>
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
              <span>{tier.quantity}</span>
              <span className="text-right">৳{tier.totalPrice.toLocaleString()}</span>
              <span className="text-right text-text-secondary">
                ৳{perUnit.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

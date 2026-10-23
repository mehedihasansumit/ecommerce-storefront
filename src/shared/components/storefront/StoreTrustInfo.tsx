"use client";

import { Banknote, RotateCcw, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { StoreTrustFact } from "@/features/stores/trust";
import { Card, formatPrice } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";

interface StoreTrustInfoProps {
  facts: StoreTrustFact[];
  /**
   * chips = one scrollable line (homepage); rows = full sentences (PDP buy box);
   * band = plain facts in the surrounding colour (under the "film" hero, in the
   * "wordmark" footer).
   */
  layout: "chips" | "rows" | "band";
  className?: string;
}

const ICONS = { cod: Banknote, delivery: Truck, exchange: RotateCcw } as const;

export function StoreTrustInfo({ facts, layout, className }: StoreTrustInfoProps) {
  const tr = useTranslations("trust");
  const locale = useLocale();
  const currency = useStoreCurrency();
  if (facts.length === 0) return null;

  const text = (f: StoreTrustFact, long: boolean) => {
    const suffix = long ? "Long" : "Short";
    switch (f.kind) {
      case "cod":
        return tr(`cod${suffix}`);
      case "delivery":
        return tr(`delivery${suffix}`, {
          inside: formatPrice(f.insideDhaka, currency, locale),
          outside: formatPrice(f.outsideDhaka, currency, locale),
        });
      case "exchange":
        return tr(`exchange${suffix}`, { days: f.days });
    }
  };

  if (layout === "band") {
    return (
      <ul
        aria-label={tr("label")}
        className={`flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium sm:gap-x-10 sm:text-[15px] ${className ?? ""}`}
      >
        {facts.map((f) => {
          const Icon = ICONS[f.kind];
          return (
            <li key={f.kind} className="inline-flex items-center gap-2 whitespace-nowrap">
              <Icon size={16} className="shrink-0 opacity-80" aria-hidden />
              {text(f, false)}
            </li>
          );
        })}
      </ul>
    );
  }

  if (layout === "chips") {
    return (
      <ul
        aria-label={tr("label")}
        className={`trust-chips flex flex-wrap gap-2 ${className ?? ""}`}
      >
        {facts.map((f) => {
          const Icon = ICONS[f.kind];
          return (
            <li
              key={f.kind}
              className="trust-chip shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              <Icon size={14} style={{ color: "var(--color-primary)" }} aria-hidden />
              {text(f, false)}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Card padding="none" className={className}>
      <ul aria-label={tr("label")} className="divide-y divide-border-subtle">
        {facts.map((f) => {
          const Icon = ICONS[f.kind];
          return (
            <li key={f.kind} className="flex items-start gap-3 px-3 py-2.5 text-sm">
              <Icon
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--color-primary)" }}
                aria-hidden
              />
              <span>{text(f, true)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

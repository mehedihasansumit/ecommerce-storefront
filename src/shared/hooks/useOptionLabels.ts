"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/shared/lib/i18n";

/**
 * Display labels for product option names and values, which the catalog stores as plain
 * strings. Common names ("Size", "Color") get a translation from `optionNames`; anything else
 * shows as entered. Purely numeric values (sizes 38, 40) are shown in the locale's digits.
 * The raw strings stay the keys used for selection and the cart.
 */
export function useOptionLabels() {
  const t = useTranslations("optionNames");
  const locale = useLocale();
  return {
    name: (name: string) => (t.has(name) ? t(name) : name),
    value: (value: string) =>
      /^\d+$/.test(value) ? formatNumber(Number(value), locale) : value,
  };
}

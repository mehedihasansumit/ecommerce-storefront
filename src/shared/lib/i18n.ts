import type { LocalizedString } from "@/shared/types/i18n";

/**
 * Resolve a (possibly-legacy-string) localized field to a plain string
 * for the given locale, with English as the fallback.
 *
 * Handles three shapes transparently:
 *   - undefined / null          → ""
 *   - plain string (legacy)     → the string as-is
 *   - LocalizedString object    → field[locale] ?? field[fallback] ?? first value
 */
export function t(
  field: string | LocalizedString | undefined | null,
  locale: string,
  fallback = "en"
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] ?? field[fallback] ?? Object.values(field)[0] ?? "";
}

/**
 * Ensure a value is stored as a LocalizedString object.
 * Wraps bare strings as { [defaultLocale]: value }.
 * Passes through existing LocalizedString objects unchanged.
 */
export function toLocalized(
  value: string | LocalizedString | undefined | null,
  defaultLocale = "en"
): LocalizedString {
  if (!value) return { [defaultLocale]: "" };
  if (typeof value === "string") return { [defaultLocale]: value };
  return value;
}

/**
 * Extract the "primary" display value for admin UI (always English or first available).
 * Useful in server components where no locale context is needed.
 */
export function tAdmin(
  field: string | LocalizedString | undefined | null,
  preferLocale = "en"
): string {
  return t(field, preferLocale);
}

/**
 * Format a number in the locale's own digits (Bengali digits for `bn`), for numbers set
 * directly in markup: badges, steppers, scores, years. Messages use `{n, number}` instead.
 */
export function formatNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    useGrouping: false,
    ...options,
  }).format(value);
}

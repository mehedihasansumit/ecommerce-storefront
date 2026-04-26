import type { LocalizedString } from "@/shared/types/i18n";

export function t(
  field: string | LocalizedString | undefined | null,
  locale: string,
  fallback = "en"
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] ?? field[fallback] ?? Object.values(field)[0] ?? "";
}

export function toLocalized(
  value: string | LocalizedString | undefined | null,
  defaultLocale = "en"
): LocalizedString {
  if (!value) return { [defaultLocale]: "" };
  if (typeof value === "string") return { [defaultLocale]: value };
  return value;
}

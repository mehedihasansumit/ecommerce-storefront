import type { LocalizedString } from "@/shared/types/i18n";

function asString(v: string | LocalizedString | undefined | null): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.en ?? Object.values(v)[0] ?? "";
}

function abbrev(s: string, len: number): string {
  const cleaned = s.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return cleaned.slice(0, len) || "X";
}

const SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomSkuSuffix(len = 5): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
  }
  return out;
}

export function generateBaseSku(
  name: string | LocalizedString,
  categoryName?: string | LocalizedString | null,
): string {
  const namePart = abbrev(asString(name), 4);
  const catPart = categoryName ? abbrev(asString(categoryName), 3) : "";
  const rand = randomSkuSuffix(5);
  return [catPart, namePart, rand].filter(Boolean).join("-");
}

export function generateVariantSku(
  baseSku: string,
  optionValues: Record<string, string>,
): string {
  const parts = Object.values(optionValues)
    .filter(Boolean)
    .map((v) => abbrev(v, 3));
  return [baseSku, ...parts].filter(Boolean).join("-");
}

import type { LocalizedString } from "@/shared/types/i18n";

function asString(v: string | LocalizedString | undefined | null): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.en ?? Object.values(v)[0] ?? "";
}

function abbrev(s: string, len: number): string {
  const words = s.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length <= 1) {
    return (words[0] ?? "").toUpperCase().slice(0, len) || "X";
  }
  // Multi-word: start with each word's initial, then backfill from word
  // bodies so "Olive Green" → "OGL" stays distinct from "Olive" → "OLI".
  let out = words.map((w) => w[0]).join("").toUpperCase();
  for (let i = 0; out.length < len && i < words.length; i++) {
    out += words[i].slice(1).toUpperCase();
  }
  return out.slice(0, len) || "X";
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

/**
 * Ensures variant SKUs are unique within a product. Two distinct option
 * values can abbreviate to the same suffix (e.g. "Olive Green" and "Olive"
 * both → "OLI"), which would violate the (productId, sku) unique index.
 * Collisions get a numeric suffix: SKU, SKU-2, SKU-3, ...
 */
export function dedupeVariantSkus<T extends { sku?: string }>(variants: T[]): T[] {
  const seen = new Set<string>();
  return variants.map((v) => {
    const base = (v.sku ?? "").trim();
    if (!base) return v;
    let candidate = base;
    let suffix = 2;
    while (seen.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix++;
    }
    seen.add(candidate);
    return { ...v, sku: candidate };
  });
}

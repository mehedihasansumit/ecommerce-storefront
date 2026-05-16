export type PricingTier = { quantity: number; totalPrice: number };

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function normalizeTiers(tiers?: PricingTier[] | null): PricingTier[] {
  if (!tiers || tiers.length === 0) return [];
  const map = new Map<number, number>();
  for (const t of tiers) {
    if (
      typeof t?.quantity !== "number" ||
      typeof t?.totalPrice !== "number" ||
      !Number.isFinite(t.quantity) ||
      !Number.isFinite(t.totalPrice) ||
      t.quantity <= 0 ||
      t.totalPrice <= 0
    ) {
      continue;
    }
    map.set(Math.floor(t.quantity), t.totalPrice);
  }
  return Array.from(map.entries())
    .map(([quantity, totalPrice]) => ({ quantity, totalPrice }))
    .sort((a, b) => a.quantity - b.quantity);
}

/**
 * Effective per-unit price for a given quantity.
 * Picks highest tier where tier.quantity <= qty; if qty exceeds highest tier,
 * uses highest tier's per-unit rate (overflow rule). Empty tiers => basePrice.
 */
export function getBulkUnitPrice(
  basePrice: number,
  quantity: number,
  tiers?: PricingTier[] | null,
): number {
  if (quantity <= 0) return basePrice;
  const sorted = normalizeTiers(tiers);
  if (sorted.length === 0) return basePrice;
  let applied: PricingTier | null = null;
  for (const t of sorted) {
    if (t.quantity <= quantity) applied = t;
    else break;
  }
  if (!applied) return basePrice;
  return applied.totalPrice / applied.quantity;
}

/**
 * Line total for a single line of qty.
 * Uses getBulkUnitPrice and rounds to 2dp at the boundary.
 */
export function getBulkLineTotal(
  basePrice: number,
  quantity: number,
  tiers?: PricingTier[] | null,
): number {
  if (quantity <= 0) return 0;
  const unit = getBulkUnitPrice(basePrice, quantity, tiers);
  return round2(unit * quantity);
}

/**
 * Allocate a product's tier-applied total across N lines (e.g. different variants
 * of same product). Sum of returned line totals equals the bundle total exactly.
 * Last line absorbs rounding drift.
 */
export function allocateBulkLineTotals(
  basePrice: number,
  lineQuantities: number[],
  tiers?: PricingTier[] | null,
): number[] {
  const totalQty = lineQuantities.reduce((s, q) => s + Math.max(0, q), 0);
  if (totalQty <= 0) return lineQuantities.map(() => 0);
  const unit = getBulkUnitPrice(basePrice, totalQty, tiers);
  const bundleTotal = round2(unit * totalQty);
  const raw = lineQuantities.map((q) => round2(unit * Math.max(0, q)));
  const sum = raw.reduce((s, v) => s + v, 0);
  const drift = round2(bundleTotal - sum);
  if (drift !== 0 && raw.length > 0) {
    let lastIdx = raw.length - 1;
    while (lastIdx > 0 && lineQuantities[lastIdx] <= 0) lastIdx--;
    raw[lastIdx] = round2(raw[lastIdx] + drift);
  }
  return raw;
}

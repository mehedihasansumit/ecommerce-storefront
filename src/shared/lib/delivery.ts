/**
 * Delivery charge resolution. Two-zone model: inside Dhaka vs everywhere else.
 * The zone is derived from the shipping address district (set by the cascading
 * Bangladesh geo selector). Pure + isomorphic — used by the checkout UI for live
 * totals and by the order service as the authoritative source of truth.
 */

export interface IStoreDeliveryConfig {
  enabled: boolean;
  insideDhakaCharge: number;
  outsideDhakaCharge: number;
}

export const DEFAULT_DELIVERY_CONFIG: IStoreDeliveryConfig = {
  enabled: false,
  insideDhakaCharge: 0,
  outsideDhakaCharge: 0,
};

/** Dhaka district names across the en/bn geo dataset. */
const DHAKA_DISTRICTS = ["dhaka", "ঢাকা"];

export function isInsideDhaka(district?: string | null): boolean {
  if (!district) return false;
  return DHAKA_DISTRICTS.includes(district.trim().toLowerCase());
}

/**
 * Delivery charge for an order. Returns 0 when the feature is disabled or a
 * campaign grants free shipping. Coerces config numbers defensively (jsonb).
 */
export function calcDeliveryCharge(
  config: IStoreDeliveryConfig | undefined | null,
  district?: string | null,
  freeShipping = false,
): number {
  if (freeShipping || !config?.enabled) return 0;
  const charge = isInsideDhaka(district)
    ? Number(config.insideDhakaCharge)
    : Number(config.outsideDhakaCharge);
  return Number.isFinite(charge) && charge > 0 ? charge : 0;
}

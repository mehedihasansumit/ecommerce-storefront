import type { IStore } from "./types";

/**
 * Trust facts a shopper checks before buying, derived from the store's real config
 * (never hard-coded marketing copy). Rendered by `StoreTrustInfo` as homepage chips
 * or PDP rows; the UI owns the wording via next-intl.
 */
export type StoreTrustFact =
  | { kind: "cod" }
  | { kind: "delivery"; insideDhaka: number; outsideDhaka: number }
  | { kind: "exchange"; days: number };

export function getStoreTrustFacts(
  store: Pick<IStore, "deliveryConfig" | "refundPolicy">
): StoreTrustFact[] {
  // Checkout places every order as cash on delivery, so this holds for all stores.
  const facts: StoreTrustFact[] = [{ kind: "cod" }];

  const delivery = store.deliveryConfig;
  // jsonb config: coerce defensively, same as calculateDeliveryCharge.
  const insideDhaka = Number(delivery?.insideDhakaCharge) || 0;
  const outsideDhaka = Number(delivery?.outsideDhakaCharge) || 0;
  // Fees not configured yet → say nothing rather than claim "৳0".
  if (delivery?.enabled && (insideDhaka > 0 || outsideDhaka > 0)) {
    facts.push({ kind: "delivery", insideDhaka, outsideDhaka });
  }

  const refund = store.refundPolicy;
  const days = Number(refund?.windowDays) || 0;
  if (refund?.enabled && days > 0) facts.push({ kind: "exchange", days });

  return facts;
}

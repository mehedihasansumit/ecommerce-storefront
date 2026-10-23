"use client";

import { useTenant } from "@/shared/context/TenantContext";
import { DEFAULT_CURRENCY } from "@/shared/lib/constants";

/** ISO currency of the current store (its payment config), for <Price> / formatPrice. */
export function useStoreCurrency(): string {
  const tenant = useTenant();
  return tenant?.payment?.currency || DEFAULT_CURRENCY;
}

"use client";

import { useTenant } from "@/shared/context/TenantContext";
import { DEFAULT_STYLES, type ResolvedStoreStyles } from "@/features/stores/styles";

/**
 * The current Store's Style Switch choices. The root layout hands client components a
 * tenant whose theme is already resolved (defaults ← preset ← store), so this only
 * fills the defaults when there is no store (or on the admin surface).
 */
export function useStoreStyles(): ResolvedStoreStyles {
  const tenant = useTenant();
  return { ...DEFAULT_STYLES, ...tenant?.theme?.styles };
}

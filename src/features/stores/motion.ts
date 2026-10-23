/**
 * Motion settings: per-Store on/off for the home sections that move by themselves
 * (stored in `theme.motion`, next to the Style Switches). Both default to on, today's
 * behaviour. Theme Presets do not carry them: picking a preset never changes motion.
 * Off means the section shows its normal non-moving layout and no Pause toggle.
 * Visitors who prefer reduced motion never see movement either way.
 *
 * Pure module (no React, no DB): shared by types, Zod schemas, resolveTheme and the
 * admin form.
 */

export const MOTION_KEYS = ["categories", "newArrivals"] as const;
export type MotionKey = (typeof MOTION_KEYS)[number];

export interface IStoreMotion {
  /** Home "Shop by Category" auto-scroll (from MARQUEE_MIN categories). */
  categories?: boolean;
  /** Home "New Arrivals" auto-scroll (from NEW_ARRIVALS_MARQUEE_MIN products). */
  newArrivals?: boolean;
}

export type ResolvedStoreMotion = Required<IStoreMotion>;

export const DEFAULT_MOTION: ResolvedStoreMotion = {
  categories: true,
  newArrivals: true,
};

/** Keeps only known boolean keys, so a stale or hand-edited value falls back to the default. */
export function sanitizeMotion(motion: unknown): IStoreMotion {
  if (!motion || typeof motion !== "object") return {};
  const out: IStoreMotion = {};
  for (const key of MOTION_KEYS) {
    const value = (motion as Record<string, unknown>)[key];
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

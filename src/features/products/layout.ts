/**
 * Home "New Arrivals" rail: when it auto-scrolls (the marquee), in one place.
 *
 * Marquee cards keep the rail's widths (44vw up to 240px on phones, 240px from md)
 * and the shared marquee gaps (16 / 24 / 32px). One set must be wider than its
 * viewport (the max-w-7xl container, 1280px at most) or the loop would show a gap:
 *   phone  < 640px:  n · (0.44·vw + 16) > vw   → n ≥ 3
 *   sm   640–767px:  n · (240 + 24) > 767      → n ≥ 3
 *   md  768–1023px:  n · (240 + 24) > 1023     → n ≥ 4
 *   lg     ≥ 1024px: n · (240 + 32) > 1280     → n ≥ 5
 * 6 clears every breakpoint with at least one card to spare (6 · 272 = 1632 > 1280),
 * so the loop never shows a gap and a short list does not visibly repeat on desktop.
 * Below it the normal swipe rail stays.
 */
export const NEW_ARRIVALS_MARQUEE_MIN = 6;

/**
 * @param autoScroll the Store's `theme.motion.newArrivals` (resolveTheme).
 */
export function newArrivalsMarquee(count: number, autoScroll: boolean): boolean {
  return autoScroll && count >= NEW_ARRIVALS_MARQUEE_MIN;
}

/** Home page rows load at most this many products (the rail and the featured grid). */
export const NEW_ARRIVALS_LIMIT = 12;
export const FEATURED_LIMIT = 24;

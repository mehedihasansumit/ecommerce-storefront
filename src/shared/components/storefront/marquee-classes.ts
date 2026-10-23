// Geometry shared by MarqueeRow (client) and the server skeletons, so the loading
// state reserves exactly the marquee row. A plain module (no "use client").

/**
 * The marquee viewport: a scrollbar-less overflow-x scroller (touch swipes scroll it
 * natively), hidden under reduced motion where the section's static layout shows instead.
 */
export const MARQUEE_VIEWPORT = "marquee-viewport no-scrollbar motion-reduce:hidden";

/**
 * One set of items. The leading padding equals the gap, so the seam between the two
 * sets is as wide as every other gap, and the first item lines up with the heading.
 */
export const MARQUEE_SET = "flex shrink-0 gap-4 ps-4 sm:gap-6 sm:ps-6 lg:gap-8 lg:ps-8 py-1";

/** Static layout under reduced motion only (the marquee replaces it otherwise). */
export const MARQUEE_STATIC = "hidden motion-reduce:block";

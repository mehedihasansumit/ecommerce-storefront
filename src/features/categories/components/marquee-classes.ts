// Category tile geometry for CategoryMarqueeRow (client) and the server skeletons, so
// the loading state reserves exactly the marquee row. A plain module (no "use client").
// The viewport / set / static classes are the shared storefront marquee's.

export {
  MARQUEE_SET,
  MARQUEE_STATIC,
  MARQUEE_VIEWPORT,
} from "@/shared/components/storefront/marquee-classes";

/**
 * Fixed tile widths: 7 tiles (the minimum) are always wider than the viewport
 * (phone 7×120 > 639, tablet 7×184 > 975, desktop 7×240 > 1280), so the loop never
 * shows a gap.
 */
export const MARQUEE_ITEM = "shrink-0 w-26 sm:w-40 lg:w-52";

/**
 * Skeleton name lines for a marquee tile, so the loading row is as tall as the real
 * one. `perLine` is roughly how many characters fit on one line of the name at the
 * phone / sm / lg tile widths (MARQUEE_ITEM) in that style's type size.
 */
export function marqueeNameLines(longestName: number, perLine: [phone: number, sm: number, lg: number]) {
  const [phone, sm, lg] = perLine;
  return {
    lines: longestName > phone ? 2 : 1,
    lastLineClassName: longestName > lg ? "" : longestName > sm ? "lg:hidden" : "sm:hidden",
  };
}

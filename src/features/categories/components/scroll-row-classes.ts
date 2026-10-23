// Class strings for CategoryScrollRow and the tiles placed in it. A plain module (no
// "use client") so server components and skeletons can share the exact geometry.

/** Scroll-row tile widths: ~3.5 visible on a phone, 4.5 / 5.5 on tablets, exactly 6 on desktop. */
export const SCROLL_TILE =
  "shrink-0 snap-start w-[calc((100%-36px)/3.5)] sm:w-[calc((100%-64px)/4.5)] md:w-[calc((100%-80px)/5.5)] lg:w-[calc((100%-120px)/6)]";

/** The snap row itself: bleeds to the screen edge below 1024px. */
export const SCROLL_LIST =
  "no-scrollbar flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto overscroll-x-contain snap-x snap-mandatory -mx-4 px-4 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 lg:mx-0 lg:px-0 lg:scroll-px-0 pt-1 pb-2";

import { Skeleton, SkeletonText } from "@/shared/components/ui";

// Server-component-safe skeletons (no hooks) for loading.tsx fallbacks. Every box
// copies the classes of the real component it stands in for, so the swap from
// skeleton to content does not move anything.

/**
 * Mirrors ProductCard: square image, a two-line title box and the rating row (the
 * real card always reserves both), price row. For the "editorial" and "plate"
 * productCardStyle the box, ratio and rating row change in CSS
 * (html[data-card-style] .pc-skel*, globals.css), so loading.tsx files need no props.
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="pc-skel flex flex-col overflow-hidden border border-border-subtle bg-[var(--color-card-bg)] rounded-[var(--border-radius)]"
    >
      <Skeleton radius="none" className="pc-skel-media aspect-square" />
      <div className="pc-skel-body flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <SkeletonText className="pc-skel-title text-sm leading-snug" width="w-full" lines={2} lastWidth="w-2/3" />
        <Skeleton radius="lg" className="pc-skel-rating h-4 w-24" />
        <div className="mt-auto pt-1">
          <SkeletonText className="text-base" width="w-20" />
        </div>
      </div>
    </div>
  );
}

/** Same grid as ProductGrid (minus the stagger: skeletons appear at once). */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mirrors ProductRail: title row + a swipe row of ~44vw cards (240px from md). */
export function ProductRailSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section aria-hidden className="py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between gap-4 mb-3 md:mb-6">
        <SkeletonText className="text-lg md:text-2xl" width="w-28 md:w-36" />
        <SkeletonText className="text-sm" width="w-16" />
      </div>
      <div className="max-w-7xl mx-auto flex gap-3 md:gap-5 overflow-hidden px-4 sm:px-6 lg:px-8 pb-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="shrink-0 w-[44vw] max-w-60 md:w-60">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

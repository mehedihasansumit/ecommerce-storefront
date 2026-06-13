// Server-component-safe skeletons (no "use client", no hooks/i18n) so they can be
// imported directly into loading.tsx Suspense fallbacks. Uses the themeable
// `.shimmer` class (globals.css) — never animate-pulse, per UI spec.

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`shimmer ${className ?? ""}`}
      style={{ borderRadius: "var(--border-radius)" }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      className="border border-border-subtle overflow-hidden"
      style={{ backgroundColor: "var(--color-card-bg)", borderRadius: "var(--border-radius)" }}
    >
      {/* Image */}
      <div className="aspect-square shimmer" />

      {/* Content — mirrors ProductCard p-4 block */}
      <div className="p-4">
        {/* Title (2 lines) */}
        <div className="space-y-1.5 mb-2">
          <Shimmer className="h-3.5 w-full" />
          <Shimmer className="h-3.5 w-2/3" />
        </div>
        {/* Rating row (stars + count) */}
        <Shimmer className="h-3 w-24 mb-2" />
        {/* Price + struck compare-at */}
        <div className="flex items-baseline gap-2">
          <Shimmer className="h-5 w-20" />
          <Shimmer className="h-3.5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  // Same grid as ProductGrid, WITHOUT stagger-children (skeletons appear at once).
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

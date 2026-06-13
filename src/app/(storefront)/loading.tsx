import { ProductGridSkeleton } from "@/features/products/components/ProductSkeletons";

// Suspense fallback for the storefront homepage. Mirrors page.tsx shell: hero +
// trust badges + category circles + product grids. Server-component (no "use
// client", no hooks/i18n) so it can be a Suspense fallback. Approximate by design —
// goal is a stable, on-brand placeholder, not pixel-perfect.
export default function HomeLoading() {
  return (
    <div className="pt-4">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="aspect-[21/9] md:aspect-[3/1] shimmer"
          style={{ borderRadius: "var(--border-radius)" }}
        />
      </div>

      {/* Trust badges */}
      <section className="border-b border-border-subtle mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl shimmer" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="shimmer h-3.5 w-24 rounded-md" />
                  <div className="shimmer h-3 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="mb-10 md:mb-14 space-y-3">
          <div className="shimmer h-6 w-28 rounded-full" />
          <div className="shimmer h-9 w-64 rounded-lg" />
          <div className="shimmer h-4 w-80 max-w-full rounded-md" />
        </div>
        <div className="flex gap-4 md:gap-6 overflow-hidden pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 flex flex-col items-center gap-3 w-20 md:w-24"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 shimmer rounded-full" />
              <div className="shimmer h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <div className="shimmer h-8 w-48 rounded-lg" />
            <div className="shimmer h-4 w-64 max-w-full rounded-md" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 space-y-2">
            <div className="shimmer h-8 w-52 rounded-lg" />
            <div className="shimmer h-4 w-72 max-w-full rounded-md" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </section>
    </div>
  );
}

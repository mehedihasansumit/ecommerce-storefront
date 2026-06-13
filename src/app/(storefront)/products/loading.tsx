import { ProductGridSkeleton } from "@/features/products/components/ProductSkeletons";

// Suspense fallback for the products listing. Mirrors products/page.tsx shell so
// there is no layout shift when real content swaps in. Shows on initial load and
// on every searchParams navigation (page/category/search/sort).
export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="shimmer h-8 w-48 rounded-lg" />
        <div className="shimmer h-4 w-32 rounded-lg" />
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside className="w-full lg:w-60 shrink-0">
          <div
            className="p-5 bg-bg shadow-xs border border-border-subtle"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <div className="shimmer h-4 w-24 rounded-lg mb-4" />
            <div className="shimmer h-10 w-full rounded-lg mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shimmer h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </aside>

        {/* Grid column */}
        <div className="flex-1 min-w-0">
          {/* Results bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="shimmer h-4 w-40 rounded-lg" />
            <div className="shimmer h-9 w-36 rounded-lg" />
          </div>

          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}

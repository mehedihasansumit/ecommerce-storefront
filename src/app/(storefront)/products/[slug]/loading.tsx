// Suspense fallback for the product detail page. Mirrors products/[slug]/page.tsx
// shell: breadcrumb + two-column (gallery / info) layout. Approximate by design —
// goal is a stable, on-brand placeholder, not pixel-perfect.
export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
      {/* Breadcrumb */}
      <div className="shimmer h-3.5 w-64 max-w-full rounded-lg mb-8" />

      {/* Gallery + info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div
            className="aspect-square shimmer"
            style={{ borderRadius: "var(--border-radius)" }}
          />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 sm:w-20 sm:h-20 shimmer"
                style={{ borderRadius: "var(--border-radius)" }}
              />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="shimmer h-7 w-3/4 rounded-lg" />
            <div className="shimmer h-7 w-1/2 rounded-lg" />
          </div>
          <div className="shimmer h-8 w-32 rounded-lg" />
          <div className="space-y-2 pt-2">
            <div className="shimmer h-4 w-full rounded-lg" />
            <div className="shimmer h-4 w-full rounded-lg" />
            <div className="shimmer h-4 w-2/3 rounded-lg" />
          </div>
          {/* Options */}
          <div className="flex gap-2 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-10 w-16 rounded-lg" />
            ))}
          </div>
          {/* CTA */}
          <div
            className="shimmer h-12 w-full mt-4"
            style={{ borderRadius: "var(--border-radius)" }}
          />
        </div>
      </div>
    </div>
  );
}

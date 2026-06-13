import { ProductGridSkeleton } from "@/features/products/components/ProductSkeletons";

// Suspense fallback for a category listing. Mirrors categories/[slug]/page.tsx
// shell (breadcrumb + title + grid) — no sidebar on this route.
export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="shimmer h-4 w-40 rounded-lg mb-6" />

      {/* Title + description */}
      <div className="shimmer h-9 w-56 rounded-lg mb-2" />
      <div className="shimmer h-4 w-80 max-w-full rounded-lg mb-8" />

      <ProductGridSkeleton />
    </div>
  );
}

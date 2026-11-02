import { getTranslations } from "next-intl/server";
import { ProductGridSkeleton } from "@/features/products/components/ProductSkeletons";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";

// Loading state for a category listing. Mirrors categories/[slug]/page.tsx:
// breadcrumb (40px tap rows), display title, description, grid. No sidebar here.
export default async function CategoryLoading() {
  const tc = await getTranslations("common");
  return (
    <SkeletonRegion
      label={tc("loading")}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      <div aria-hidden>
        {/* Breadcrumb: Home › Category */}
        <div className="flex items-center gap-2 text-sm mb-2 md:mb-4 min-h-10">
          <Skeleton radius="lg" className="h-[0.7em] w-10" />
          <Skeleton radius="lg" className="h-[0.7em] w-20" />
        </div>
        <SkeletonText className="text-3xl md:text-4xl mb-2" width="w-56 md:w-72" />
        <SkeletonText className="mb-6 md:mb-8 max-w-2xl" width="w-64 max-w-full" />
      </div>
      <ProductGridSkeleton count={ITEMS_PER_PAGE} />
    </SkeletonRegion>
  );
}

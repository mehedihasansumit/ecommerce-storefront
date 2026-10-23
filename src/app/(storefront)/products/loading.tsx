import { getLocale, getTranslations } from "next-intl/server";
import { getTenant } from "@/shared/lib/tenant";
import {
  getStoreCategories,
  getTopLevelCategoriesWithProducts,
} from "@/features/categories/storefront";
import { ProductGridSkeleton } from "@/features/products/components/ProductSkeletons";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";
import { t as tl } from "@/shared/lib/i18n";

// Loading state for /products (first load and every page/category/search/sort
// change). Mirrors page.tsx: title block, phone/tablet chip row + search, desktop
// sidebar, results bar, grid. Chip and sidebar widths follow the real category
// names so the row does not reflow when the page arrives. Category reads are
// memoised per request (features/categories/storefront.ts): page.tsx reuses them.
export default async function ProductsLoading() {
  const [tenant, tc, locale] = await Promise.all([
    getTenant(),
    getTranslations("common"),
    getLocale(),
  ]);
  const categories = tenant
    ? await getStoreCategories(tenant._id).catch(() => [])
    : [];
  const chips =
    tenant && categories.length > 0
      ? await getTopLevelCategoriesWithProducts(tenant._id).catch(() => [])
      : [];
  // Label lengths in `ch`; the first entry stands for "All".
  const chipLabels = [3, ...chips.map(({ category }) => tl(category.name, locale).length)];
  const sideLabels = [3, ...categories.map((c) => tl(c.name, locale).length)];

  return (
    <SkeletonRegion
      label={tc("loading")}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10"
    >
      {/* Page header */}
      <div aria-hidden className="mb-4 md:mb-8">
        <SkeletonText className="text-2xl md:text-3xl mb-1" width="w-48" />
        <SkeletonText className="text-sm" width="w-24" />
      </div>

      {/* Phones/tablets: category chips + search */}
      {categories.length > 0 && (
        <div aria-hidden className="lg:hidden mb-5 space-y-3">
          {chips.length > 0 && (
            <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 flex gap-2 overflow-hidden py-0.5">
              {chipLabels.map((len, i) => (
                <Skeleton
                  key={i}
                  radius="full"
                  className="shrink-0 h-10 text-sm"
                  style={{ width: `calc(${len}ch + 2rem)` }}
                />
              ))}
            </div>
          )}
          <Skeleton className="mb-4 w-full h-11" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Desktop sidebar */}
        {categories.length > 0 && (
          <div aria-hidden className="hidden lg:block w-60 shrink-0">
            <div
              className="p-5 bg-bg shadow-[var(--shadow-xs)] border border-border-subtle"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <SkeletonText className="mb-4 text-sm" width="w-28" />
              <Skeleton className="mb-4 w-full h-11" />
              <div className="space-y-0.5">
                {sideLabels.map((len, i) => (
                  <div key={i} className="px-3 py-2 text-sm">
                    <span
                      className="shimmer inline-block h-[0.7em] max-w-full align-middle rounded-sm"
                      style={{ width: `${len}ch` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Results bar: "Showing x–y of z" + sort select */}
          <div aria-hidden className="flex flex-wrap items-center justify-between mb-4 gap-2 sm:gap-4">
            <SkeletonText className="text-xs" width="w-28" />
            <Skeleton className="h-10 w-44" />
          </div>
          <ProductGridSkeleton count={ITEMS_PER_PAGE} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

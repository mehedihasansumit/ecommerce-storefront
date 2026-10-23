import { getLocale, getTranslations } from "next-intl/server";
import { t as tl } from "@/shared/lib/i18n";
import { getTenant } from "@/shared/lib/tenant";
import { getTopLevelCategoriesWithProducts } from "@/features/categories/storefront";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { HeroBannerSkeleton } from "@/shared/components/storefront/HeroBannerSkeleton";
import { StoreTrustInfo } from "@/shared/components/storefront/StoreTrustInfo";
import { CategorySectionSkeleton } from "@/features/categories/components/CategorySection";
import { usesStyledHero } from "@/shared/components/storefront/hero-styles";
import { resolveTheme } from "@/features/stores/presets";
import { ProductRailSkeleton } from "@/features/products/components/ProductSkeletons";
import { SkeletonRegion } from "@/shared/components/ui";

// Home loading state. Reads only the store config (memoised with the layout's lookup)
// and the category showcase (memoised, page.tsx reuses the same result), so it reserves the same hero box, the real trust chips and
// the same "Shop by Category" layout as page.tsx while products load. It stops after
// the New Arrivals rail: the featured grid only exists for some stores, and
// everything below the rail starts off-screen on phones and desktop alike.
export default async function HomeLoading() {
  const [tenant, tc, locale] = await Promise.all([
    getTenant(),
    getTranslations("common"),
    getLocale(),
  ]);
  const showcase = tenant
    ? await getTopLevelCategoriesWithProducts(tenant._id).catch(() => [])
    : [];
  const longestName = Math.max(0, ...showcase.map(({ category }) => tl(category.name, locale).length));
  const styles = resolveTheme(tenant?.theme).styles;
  const flushHero =
    !!tenant &&
    !tenant.heroContained &&
    usesStyledHero(tenant.heroBanners, tenant.heroLayout, styles.heroStyle);
  const trustFacts = tenant ? getStoreTrustFacts(tenant) : [];
  const trustBand = flushHero && styles.heroStyle === "film";

  return (
    <SkeletonRegion label={tc("loading")} className={flushHero ? undefined : "pt-4"}>
      {tenant && (
        <>
          <HeroBannerSkeleton
            banners={tenant.heroBanners}
            layout={tenant.heroLayout}
            contained={tenant.heroContained}
            borderRadius={tenant.heroBorderRadius}
            heroStyle={styles.heroStyle}
          />
          {/* Store config, not product data: show the real trust facts straight away */}
          {trustBand ? (
            trustFacts.length > 0 && (
              <div
                className="mb-4 md:mb-6"
                style={{ backgroundColor: "var(--color-header-bg)", color: "var(--color-header-text)" }}
              >
                <StoreTrustInfo
                  facts={trustFacts}
                  layout="band"
                  className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
                />
              </div>
            )
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <StoreTrustInfo facts={trustFacts} layout="chips" />
            </div>
          )}
        </>
      )}

      <CategorySectionSkeleton
        categoryStyle={styles.categoryStyle}
        count={showcase.length}
        longestName={longestName}
      />

      <ProductRailSkeleton />
    </SkeletonRegion>
  );
}

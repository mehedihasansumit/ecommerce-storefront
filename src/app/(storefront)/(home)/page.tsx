import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { getTopLevelCategoriesWithProducts } from "@/features/categories/storefront";
import { HeroBanner } from "@/shared/components/storefront/HeroBanner";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { ProductRail } from "@/features/products/components/ProductRail";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { StoreTrustInfo } from "@/shared/components/storefront/StoreTrustInfo";
import { createStoreMetadata, buildOrganizationJsonLd } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { t } from "@/shared/lib/i18n";
import { ArrowRight } from "lucide-react";
import { HomeNewsletter } from "@/shared/components/storefront/HomeNewsletter";
import { usesStyledHero } from "@/shared/components/storefront/hero-styles";
import { CategorySection } from "@/features/categories/components/CategorySection";
import { resolveTheme } from "@/features/stores/presets";
import { newArrivalsMarquee } from "@/features/products/layout";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Store" };
  const locale = await getLocale();
  return createStoreMetadata(tenant, { path: "/" }, locale);
}

export default async function HomePage() {
  const tenant = await getTenant();
  const locale = await getLocale();
  const tr = await getTranslations("home");

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{tr("storeNotFound")}</h1>
          <p className="text-text-secondary">{tr("noStoreConfigured")}</p>
        </div>
      </div>
    );
  }

  const [featuredProducts, newArrivals, showcase] = await Promise.all([
    ProductService.getFeatured(tenant._id, undefined),
    ProductService.getNewArrivals(tenant._id, undefined),
    getTopLevelCategoriesWithProducts(tenant._id),
  ]);

  const orgJsonLd = buildOrganizationJsonLd(tenant);
  const railIds = new Set(newArrivals.map((p) => p._id));
  const featuredOnly = featuredProducts.filter((p) => !railIds.has(p._id));
  const { styles, motion } = resolveTheme(tenant.theme);
  // The styled full-bleed hero sits flush under the header (no gap strip).
  const flushHero =
    !tenant.heroContained && usesStyledHero(tenant.heroBanners, tenant.heroLayout, styles.heroStyle);
  const trustFacts = getStoreTrustFacts(tenant);
  // "film": the service facts sit on a band in the header colour right under the film.
  const trustBand = flushHero && styles.heroStyle === "film";

  return (
    <div className={flushHero ? undefined : "pt-4"}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {/* Hero Banner */}
      <HeroBanner
        banners={tenant.heroBanners}
        layout={tenant.heroLayout}
        contained={tenant.heroContained}
        borderRadius={tenant.heroBorderRadius}
      />

      {/* Trust facts from the store's real config (COD, delivery fee, exchange window) */}
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

      {/* Shop by Category: straight after hero + trust strip, above New Arrivals.
          The categoryStyle Style Switch picks the layout; each adapts to the count. */}
      <CategorySection
        categoryStyle={styles.categoryStyle}
        autoScroll={motion.categories}
        locale={locale}
        description={tr("shopByCategoryDesc")}
        title={tr("shopByCategory")}
        items={showcase.map(({ category, count }) => ({
          id: category._id,
          href: `/categories/${category.slug}`,
          name: t(category.name, locale),
          image: category.image,
          meta: tr("categoryCount", { count }),
        }))}
        viewAllHref="/products"
        viewAllLabel={tr("viewAll")}
      />

      {/* New arrivals rail: first products land on the first mobile screen. From
          NEW_ARRIVALS_MARQUEE_MIN products it moves left to right (theme.motion.newArrivals). */}
      <ProductRail
        title={tr("newArrivals")}
        products={newArrivals}
        viewAllHref="/products"
        viewAllLabel={tr("viewAll")}
        marquee={
          newArrivalsMarquee(newArrivals.length, motion.newArrivals)
            ? { id: "home-new-arrivals-marquee", pauseLabel: tr("newArrivalsPause") }
            : undefined
        }
      />

      {/* Featured Products (minus what the rail already shows) */}
      {featuredOnly.length > 0 && (
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-2">
                {tr("featuredProducts")}
              </h2>
              <p className="text-text-secondary">
                {tr("featuredProductsDesc") ||
                  "Hand-picked products just for you"}
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-border-subtle hover:border-text-secondary hover:bg-surface dark:hover:bg-surface transition-all"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              {tr("viewAll")}
              <ArrowRight size={16} />
            </Link>
          </div>
          <ProductGrid products={featuredOnly} />
          <div className="text-center mt-10 sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {tr("viewAll")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* Newsletter / CTA in the newsletterStyle Style Switch */}
      <HomeNewsletter storeId={tenant._id} newsletterStyle={styles.newsletterStyle} />
    </div>
  );
}

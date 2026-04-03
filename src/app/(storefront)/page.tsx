import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { HeroBanner } from "@/shared/components/storefront/HeroBanner";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Store" };
  return createStoreMetadata(tenant, { path: "/" });
}

export default async function HomePage() {
  const tenant = await getTenant();
  const t = await getTranslations("home");

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("storeNotFound")}</h1>
          <p className="text-gray-500">
            {t("noStoreConfigured")}
          </p>
        </div>
      </div>
    );
  }

  const [featuredProducts, categories] = await Promise.all([
    ProductService.getFeatured(tenant._id, 8),
    CategoryService.getByStore(tenant._id),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner banners={tenant.heroBanners} />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold mb-6">{t("shopByCategory")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden bg-gray-100 aspect-4/3 flex items-center justify-center"
                style={{ borderRadius: "var(--border-radius)" }}
              >
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <span className="relative text-white font-semibold text-lg">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("featuredProducts")}</h2>
          <Link
            href="/products"
            className="text-sm font-medium hover:opacity-80"
            style={{ color: "var(--color-primary)" }}
          >
            {t("viewAll")}
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>
    </div>
  );
}

import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { HeroBanner } from "@/shared/components/storefront/HeroBanner";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { t } from "@/shared/lib/i18n";
import {
  ArrowRight,
  Truck,
  Shield,
  RotateCcw,
  Headphones,
} from "lucide-react";
import { NewsletterForm } from "@/shared/components/storefront/NewsletterForm";

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
          <p className="text-gray-500">{tr("noStoreConfigured")}</p>
        </div>
      </div>
    );
  }

  const [featuredProducts, newArrivals, categories] = await Promise.all([
    ProductService.getFeatured(tenant._id, 8),
    ProductService.getNewArrivals(tenant._id, 8),
    CategoryService.getByStore(tenant._id),
  ]);

  return (
    <div>
      {/* Hero Banner */}
      <HeroBanner banners={tenant.heroBanners} />

      {/* Trust badges */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: tr("freeShipping") || "Free Shipping",
                desc: tr("freeShippingDesc") || "On orders over ৳500",
              },
              {
                icon: Shield,
                title: tr("securePayment") || "Secure Payment",
                desc: tr("securePaymentDesc") || "100% secure checkout",
              },
              {
                icon: RotateCcw,
                title: tr("easyReturns") || "Easy Returns",
                desc: tr("easyReturnsDesc") || "30-day return policy",
              },
              {
                icon: Headphones,
                title: tr("support247") || "24/7 Support",
                desc: tr("support247Desc") || "Dedicated support",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 text-center md:text-left"
              >
                <div
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                  }}
                >
                  <item.icon
                    size={20}
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center mb-12 md:mb-14">
            <h2 className="text-3xl font-semibold tracking-tight mb-3">{tr("shopByCategory")}</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {tr("shopByCategoryDesc") ||
                "Explore our curated collections"}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden bg-gray-100 aspect-[3/4] flex items-end"
                style={{ borderRadius: "var(--border-radius)" }}
              >
                {category.image && (
                  <img
                    src={category.image}
                    alt={t(category.name, locale)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                <div className="relative w-full p-5">
                  <span className="text-white font-semibold text-lg block">
                    {t(category.name, locale)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/70 text-sm mt-1 group-hover:text-white/90 transition-colors">
                    {tr("explore") || "Explore"}
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-20 md:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight mb-2">
                  {tr("newArrivals")}
                </h2>
                <p className="text-gray-500">
                  {tr("newArrivalsDesc")}
                </p>
              </div>
              <Link
                href="/products"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                style={{ borderRadius: "var(--border-radius)" }}
              >
                {tr("viewAll")}
                <ArrowRight size={16} />
              </Link>
            </div>
            <ProductGrid products={newArrivals} />
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

      {/* Featured Products */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-2">
                {tr("featuredProducts")}
              </h2>
              <p className="text-gray-500">
                {tr("featuredProductsDesc") ||
                  "Hand-picked products just for you"}
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              {tr("viewAll")}
              <ArrowRight size={16} />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
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

      {/* Newsletter / CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden px-8 py-20 md:px-20 text-center text-white"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "calc(var(--border-radius) * 2)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {tr("newsletterTitle") || "Stay in the Loop"}
              </h2>
              <p className="text-white/80 max-w-md mx-auto mb-8">
                {tr("newsletterDesc") ||
                  "Subscribe to get special offers, free giveaways, and new arrivals."}
              </p>
              <NewsletterForm
                emailPlaceholder={tr("emailPlaceholder")}
                subscribeLabel={tr("subscribe")}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

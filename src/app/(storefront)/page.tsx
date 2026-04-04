import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { HeroBanner } from "@/shared/components/storefront/HeroBanner";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
          <p className="text-gray-500">{t("noStoreConfigured")}</p>
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

      {/* Trust badges */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: t("freeShipping") || "Free Shipping",
                desc: t("freeShippingDesc") || "On orders over ৳500",
              },
              {
                icon: Shield,
                title: t("securePayment") || "Secure Payment",
                desc: t("securePaymentDesc") || "100% secure checkout",
              },
              {
                icon: RotateCcw,
                title: t("easyReturns") || "Easy Returns",
                desc: t("easyReturnsDesc") || "30-day return policy",
              },
              {
                icon: Headphones,
                title: t("support247") || "24/7 Support",
                desc: t("support247Desc") || "Dedicated support",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 text-center md:text-left"
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">{t("shopByCategory")}</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {t("shopByCategoryDesc") ||
                "Explore our curated collections"}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden bg-gray-100 aspect-[4/5] flex items-end"
                style={{ borderRadius: "var(--border-radius)" }}
              >
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors duration-300" />
                <div className="relative w-full p-5">
                  <span className="text-white font-semibold text-lg block">
                    {category.name}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white/70 text-sm mt-1 group-hover:text-white/90 transition-colors">
                    {t("explore") || "Explore"}
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

      {/* Featured Products */}
      <section className="bg-gray-50/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {t("featuredProducts")}
              </h2>
              <p className="text-gray-500">
                {t("featuredProductsDesc") ||
                  "Hand-picked products just for you"}
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--color-primary)" }}
            >
              {t("viewAll")}
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
              {t("viewAll")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden px-8 py-16 md:px-16 text-center text-white"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "calc(var(--border-radius) * 2)",
            }}
          >
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("newsletterTitle") || "Stay in the Loop"}
              </h2>
              <p className="text-white/80 max-w-md mx-auto mb-8">
                {t("newsletterDesc") ||
                  "Subscribe to get special offers, free giveaways, and new arrivals."}
              </p>
              <NewsletterForm
                emailPlaceholder={t("emailPlaceholder")}
                subscribeLabel={t("subscribe")}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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
  Mail,
  Sparkles,
} from "lucide-react";
import { NewsletterForm } from "@/shared/components/storefront/NewsletterForm";
import { StoreImage } from "@/shared/components/ui";

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

  const [featuredProducts, newArrivals, categories] = await Promise.all([
    ProductService.getFeatured(tenant._id, 8),
    ProductService.getNewArrivals(tenant._id, 8),
    CategoryService.getByStore(tenant._id),
  ]);

  return (
    <div className="pt-4">
      {/* Hero Banner */}
      <HeroBanner
        banners={tenant.heroBanners}
        layout={tenant.heroLayout}
        contained={tenant.heroContained}
        borderRadius={tenant.heroBorderRadius}
      />

      {/* Trust badges */}
      <section className="border-b border-border-subtle">
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
                  <p className="text-xs text-text-secondary truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
            <div className="max-w-xl">
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
                {tr("collections") || "Collections"}
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
                {tr("shopByCategory")}
              </h2>
              <p className="text-text-secondary text-base">
                {tr("shopByCategoryDesc") ||
                  "Explore our curated collections"}
              </p>
            </div>
            <Link
              href="/products"
              className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground transition-colors group/all"
            >
              {tr("viewAll")}
              <span
                className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center transition-all group-hover/all:border-foreground group-hover/all:bg-foreground group-hover/all:text-background"
              >
                <ArrowRight
                  size={14}
                  className="transition-transform duration-300 group-hover/all:translate-x-0.5"
                />
              </span>
            </Link>
          </div>

          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-1 stagger-children scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/categories/${category.slug}`}
                className="p-2 group shrink-0 flex flex-col items-center gap-3 w-20 md:w-24"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden bg-surface transition-all duration-500 ease-(--ease-out-expo) group-hover:scale-105 ring-2 ring-transparent group-hover:ring-primary ring-offset-2 ring-offset-background">
                  {category.image && (
                    <StoreImage
                      src={category.image}
                      alt={t(category.name, locale)}
                      fill
                      sizes="96px"
                      className="object-contain p-2 transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-110"
                    />
                  )}
                </div>
                <span className="text-xs md:text-sm font-medium text-center leading-tight line-clamp-2 transition-colors group-hover:text-primary">
                  {t(category.name, locale)}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {tr("viewAll")}
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className=" py-4 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight mb-2">
                  {tr("newArrivals")}
                </h2>
                <p className="text-text-secondary">
                  {tr("newArrivalsDesc")}
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
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden"
            style={{
              backgroundColor: "var(--color-newsletter-bg)",
              borderRadius: "calc(var(--border-radius) * 3)",
            }}
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Large blurred circles */}
              <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
              {/* Hard circles */}
              <div className="absolute top-6 right-24 w-6 h-6 rounded-full bg-white/20" />
              <div className="absolute bottom-8 left-1/3 w-4 h-4 rounded-full bg-white/20" />
              <div className="absolute top-1/2 right-8 w-3 h-3 rounded-full bg-white/30" />
              {/* Grid pattern overlay */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 40px)",
                }}
              />
            </div>

            <div
              className="relative px-8 py-16 md:px-16 md:py-20 flex flex-col md:flex-row items-center gap-10 md:gap-16"
              style={{ color: "var(--color-newsletter-text)" }}
            >
              {/* Left: icon + copy */}
              <div className="flex-1 text-center md:text-left">
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-widest mb-5"
                  style={{ color: "var(--color-newsletter-text)", opacity: 0.9 }}
                >
                  <Sparkles size={13} />
                  {tr("exclusiveOffers") || "Exclusive Offers"}
                </div>
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4"
                  style={{ color: "var(--color-newsletter-text)" }}
                >
                  {tr("newsletterTitle") || (
                    <>
                      Stay in the{" "}
                      <span className="relative">
                        Loop
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white/40 rounded-full" />
                      </span>
                    </>
                  )}
                </h2>
                <p
                  className="text-base md:text-lg max-w-sm md:max-w-none"
                  style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 70%, transparent)" }}
                >
                  {tr("newsletterDesc") ||
                    "Subscribe to get special offers, free giveaways, and new arrivals straight to your inbox."}
                </p>

                {/* Social proof */}
                <div className="flex items-center gap-3 mt-6 justify-center md:justify-start">
                  <div className="flex -space-x-2">
                    {["bg-pink-300", "bg-yellow-300", "bg-green-300", "bg-blue-300"].map(
                      (color, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full ${color} border-2 border-white/30`}
                        />
                      )
                    )}
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 60%, transparent)" }}
                  >
                    {tr("subscriberCount") || "Join 2,000+ subscribers"}
                  </p>
                </div>
              </div>

              {/* Right: form card */}
              <div className="shrink-0 w-full md:w-auto md:min-w-95">
                <div
                  className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 md:p-8"
                  style={{ borderRadius: "calc(var(--border-radius) * 2)" }}
                >
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                      <Mail size={16} style={{ color: "var(--color-newsletter-text)" }} />
                    </div>
                    <div>
                      <p
                        className="font-semibold text-sm leading-tight"
                        style={{ color: "var(--color-newsletter-text)" }}
                      >
                        {tr("getNotified") || "Get Notified First"}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 55%, transparent)" }}
                      >
                        {tr("noSpam") || "No spam, unsubscribe anytime"}
                      </p>
                    </div>
                  </div>

                  <NewsletterForm
                    storeId={tenant._id}
                    emailPlaceholder={tr("emailPlaceholder") || "you@example.com"}
                    subscribeLabel={tr("subscribe") || "Subscribe"}
                  />

                  <p
                    className="text-xs text-center mt-4"
                    style={{ color: "color-mix(in srgb, var(--color-newsletter-text) 40%, transparent)" }}
                  >
                    {tr("privacyNote") ||
                      "By subscribing you agree to our Privacy Policy."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

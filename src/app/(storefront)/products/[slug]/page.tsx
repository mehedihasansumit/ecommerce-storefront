import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import {
  createStoreMetadata,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
} from "@/shared/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ChevronRight, Truck, RotateCcw, Shield } from "lucide-react";
import { ProductDetailClient } from "@/features/products/components/ProductDetailClient";
import { ReviewSection } from "@/features/reviews/components/ReviewSection";
import { t } from "@/shared/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Product" };

  const { slug } = await params;
  const product = await ProductService.getBySlug(tenant._id, slug);
  if (!product) return { title: "Product Not Found" };

  const locale = await getLocale();
  return createStoreMetadata(tenant, {
    title: t(product.seo.title, locale) || t(product.name, locale),
    description: t(product.seo.description, locale) || t(product.shortDescription, locale),
    image: product.thumbnail || product.images[0]?.url,
    path: `/products/${product.slug}`,
  }, locale);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tenant = await getTenant();
  const tr = await getTranslations("productDetail");
  const locale = await getLocale();
  if (!tenant) return null;

  const { slug } = await params;
  const product = await ProductService.getBySlug(tenant._id, slug);
  if (!product) notFound();

  const domain = tenant.domains[0] || "localhost:3000";
  const storeUrl = `https://${domain}`;

  const productJsonLd = buildProductJsonLd(product, storeUrl, locale);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: tr("home"), url: storeUrl },
    { name: tr("products"), url: `${storeUrl}/products` },
    { name: t(product.name, locale), url: `${storeUrl}/products/${product.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-text-tertiary mb-8">
          <Link href="/" className="hover:text-[var(--color-text)] transition-colors">
            {tr("home")}
          </Link>
          <ChevronRight size={14} className="text-text-tertiary" />
          <Link href="/products" className="hover:text-[var(--color-text)] transition-colors">
            {tr("products")}
          </Link>
          <ChevronRight size={14} className="text-text-tertiary" />
          <span className="text-[var(--color-text)] font-medium truncate max-w-48">
            {t(product.name, locale)}
          </span>
        </nav>

        {/* Interactive product section (gallery + options + cart) */}
        <ProductDetailClient
          product={product}
          socialOrdering={tenant.socialOrdering}
          productUrl={`${storeUrl}/products/${product.slug}`}
        />

        {/* Trust signals */}
        <div className="mt-8 flex items-center gap-8 pt-6 border-t border-border-subtle">
          {[
            { icon: Truck, label: tr("freeShipping") || "Free Shipping" },
            { icon: RotateCcw, label: tr("easyReturns") || "Easy Returns" },
            { icon: Shield, label: tr("secureCheckout") || "Secure Checkout" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon size={16} style={{ color: "var(--color-primary)", opacity: 0.7 }} />
              <span className="text-xs text-text-secondary">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Description & Tags */}
        <div className="mt-20 border-t border-border-subtle pt-14">
          {t(product.description, locale) && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-semibold mb-6">{tr("description")}</h2>
              <div className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {t(product.description, locale)}
              </div>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-surface border border-border-subtle text-text-secondary text-xs font-medium hover:bg-border-subtle dark:hover:bg-gray-700 transition-colors cursor-default"
                  style={{ borderRadius: "var(--border-radius)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-border-subtle pt-14">
          <ReviewSection
            productId={product._id}
            storeId={tenant._id}
            averageRating={product.averageRating}
            reviewCount={product.reviewCount}
          />
        </div>
      </div>
    </>
  );
}

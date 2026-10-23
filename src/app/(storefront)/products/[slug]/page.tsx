import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { getProductBySlug } from "@/features/products/storefront";
import {
  createStoreMetadata,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
} from "@/shared/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { ProductDetailClient } from "@/features/products/components/ProductDetailClient";
import { ProductRail } from "@/features/products/components/ProductRail";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { ReviewSection } from "@/features/reviews/components/ReviewSection";
import { t } from "@/shared/lib/i18n";
import { isHtml, plainTextToHtml } from "@/shared/lib/html";
import { sanitizeDescription } from "@/shared/lib/sanitize";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Product" };

  const { slug } = await params;
  const product = await getProductBySlug(tenant._id, slug);
  if (!product) return { title: "Product Not Found" };

  const locale = await getLocale();
  return createStoreMetadata(tenant, {
    title: t(product.seo.title, locale) || t(product.name, locale),
    description: t(product.seo.description, locale) || t(product.shortDescription, locale),
    image: product.thumbnail || product.images?.[0]?.url,
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
  const product = await getProductBySlug(tenant._id, slug);
  if (!product) notFound();
  const related = await ProductService.getRelated(tenant._id, product);

  const domain = tenant.domains?.[0] || "localhost:3000";
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 md:py-8">
        {/* Breadcrumbs */}
        <nav aria-label={tr("home")} className="flex items-center gap-2 text-sm text-text-secondary mb-2 md:mb-6">
          <Link href="/" className="focus-ring inline-flex min-h-10 items-center hover:text-[var(--color-text)] transition-colors">
            {tr("home")}
          </Link>
          <ChevronRight size={14} aria-hidden className="text-text-tertiary shrink-0" />
          <Link href="/products" className="focus-ring inline-flex min-h-10 items-center hover:text-[var(--color-text)] transition-colors">
            {tr("products")}
          </Link>
          <ChevronRight size={14} aria-hidden className="text-text-tertiary shrink-0" />
          <span aria-current="page" className="text-[var(--color-text)] font-medium truncate max-w-48 sm:max-w-none">
            {t(product.name, locale)}
          </span>
        </nav>

        {/* Interactive product section (gallery + options + cart) */}
        <ProductDetailClient
          product={product}
          socialOrdering={tenant.socialOrdering}
          productUrl={`${storeUrl}/products/${product.slug}`}
          trustFacts={getStoreTrustFacts(tenant)}
        />

      </div>

      <div className="-mt-4 md:mt-0">
        <ProductRail title={tr("similarProducts")} products={related} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-8">
        {/* Description & Tags */}
        <div className="mt-20 border-t border-border-subtle pt-14">
          {t(product.description, locale) && (
            <div className="max-w-3xl">
              <h2 className="text-xl font-semibold mb-6">{tr("description")}</h2>
              <div
                className="rte-content text-text-secondary leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: sanitizeDescription(
                    isHtml(t(product.description, locale))
                      ? t(product.description, locale)
                      : plainTextToHtml(t(product.description, locale))
                  ),
                }}
              />
            </div>
          )}

          {(product.tags?.length ?? 0) > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-surface border border-border-subtle text-text-secondary text-xs font-medium hover:bg-border-subtle transition-colors cursor-default"
                  style={{ borderRadius: "var(--border-radius)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="mt-16 border-t border-border-subtle pt-14 scroll-mt-20">
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

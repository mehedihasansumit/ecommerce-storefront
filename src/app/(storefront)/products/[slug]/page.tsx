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
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            {t("home")}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <Link href="/products" className="hover:text-gray-900 transition-colors">
            {t("products")}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-gray-900 font-medium truncate max-w-48">
            {t(product.name, locale)}
          </span>
        </nav>

        {/* Interactive product section (gallery + options + cart) */}
        <ProductDetailClient product={product} />

        {/* Trust signals */}
        <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 max-w-lg">
          {[
            { icon: Truck, label: tr("freeShipping") || "Free Shipping" },
            { icon: RotateCcw, label: tr("easyReturns") || "Easy Returns" },
            { icon: Shield, label: tr("secureCheckout") || "Secure Checkout" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
              <item.icon size={18} className="text-gray-400" />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Description & Tags */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          {t(product.description, locale) && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">{tr("description")}</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {t(product.description, locale)}
              </div>
            </div>
          )}

          {product.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors cursor-default"
                  style={{ borderRadius: "var(--border-radius)" }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

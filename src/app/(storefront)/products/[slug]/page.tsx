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
import { getTranslations } from "next-intl/server";
import { ProductImageGallery } from "@/features/products/components/ProductImageGallery";
import { ChevronRight, Star, Truck, RotateCcw, Shield } from "lucide-react";
import { AddToCartSection } from "@/features/products/components/AddToCartSection";

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

  return createStoreMetadata(tenant, {
    title: product.seo.title || product.name,
    description: product.seo.description || product.shortDescription,
    image: product.thumbnail || product.images[0]?.url,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const tenant = await getTenant();
  const t = await getTranslations("productDetail");
  if (!tenant) return null;

  const { slug } = await params;
  const product = await ProductService.getBySlug(tenant._id, slug);
  if (!product) notFound();

  const domain = tenant.domains[0] || "localhost:3000";
  const storeUrl = `https://${domain}`;

  const productJsonLd = buildProductJsonLd(product, storeUrl);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: t("home"), url: storeUrl },
    { name: t("products"), url: `${storeUrl}/products` },
    { name: product.name, url: `${storeUrl}/products/${product.slug}` },
  ]);

  const hasDiscount =
    product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

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
          <Link
            href="/products"
            className="hover:text-gray-900 transition-colors"
          >
            {t("products")}
          </Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-gray-900 font-medium truncate max-w-48">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <ProductImageGallery
            images={product.images}
            thumbnail={product.thumbnail}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="animate-fade-in-up">
            {/* Discount badge */}
            {hasDiscount && (
              <span
                className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full mb-4"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                {t("save") || "Save"} {discountPercent}%
              </span>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.averageRating > 0 && (
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={
                        i < Math.round(product.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount} {t("reviews")})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span
                className="text-3xl md:text-4xl font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                ৳{product.price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  ৳{product.compareAtPrice.toLocaleString()}
                </span>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.shortDescription}
              </p>
            )}

            <div className="border-t border-gray-100 pt-6 space-y-6">
              {/* Stock */}
              <div>
                {product.stock > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">
                      {t("inStock", { available: product.stock })}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-sm text-red-600 font-medium">
                      {t("outOfStock")}
                    </span>
                  </div>
                )}
              </div>

              <AddToCartSection
                productId={product._id}
                productName={product.name}
                productSlug={product.slug}
                thumbnail={product.thumbnail}
                price={product.price}
                stock={product.stock}
                variants={product.variants}
                addToCartLabel={t("addToCart")}
                outOfStockLabel={t("outOfStock")}
              />
            </div>

            {/* Trust signals */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              {[
                { icon: Truck, label: t("freeShipping") || "Free Shipping" },
                { icon: RotateCcw, label: t("easyReturns") || "Easy Returns" },
                { icon: Shield, label: t("secureCheckout") || "Secure Checkout" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <item.icon size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description & Tags */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          {product.description && (
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold mb-6">{t("description")}</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description}
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

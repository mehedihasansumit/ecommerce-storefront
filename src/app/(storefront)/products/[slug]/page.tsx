import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { createStoreMetadata, buildProductJsonLd, buildBreadcrumbJsonLd } from "@/shared/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-900">
            {t("home")}
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-gray-900">
            {t("products")}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div
              className="aspect-square bg-gray-100 overflow-hidden mb-4"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              {product.thumbnail || product.images[0]?.url ? (
                <img
                  src={product.thumbnail || product.images[0].url}
                  alt={product.images[0]?.alt || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  {t("noImage")}
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-gray-100 overflow-hidden"
                    style={{ borderRadius: "var(--border-radius)" }}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {product.name}
            </h1>

            {product.averageRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-yellow-500">
                  {"★".repeat(Math.round(product.averageRating))}
                  {"☆".repeat(5 - Math.round(product.averageRating))}
                </span>
                <span className="text-sm text-gray-500">
                  ({product.reviewCount} {t("reviews")})
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-3xl font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                ৳{product.price.toFixed(2)}
              </span>
              {product.compareAtPrice > 0 &&
                product.compareAtPrice > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    ৳{product.compareAtPrice.toFixed(2)}
                  </span>
                )}
            </div>

            {product.shortDescription && (
              <p className="text-gray-600 mb-6">{product.shortDescription}</p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="space-y-4 mb-6">
                {product.variants.map((variant) => (
                  <div key={variant.name}>
                    <label className="block text-sm font-medium mb-2">
                      {variant.name}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option.value}
                          className="px-4 py-2 border border-gray-300 text-sm hover:border-gray-500 transition-colors"
                          style={{ borderRadius: "var(--border-radius)" }}
                        >
                          {option.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="text-sm text-green-600 font-medium">
                  {t("inStock", { available: product.stock })}
                </span>
              ) : (
                <span className="text-sm text-red-600 font-medium">
                  {t("outOfStock")}
                </span>
              )}
            </div>

            {/* Add to Cart */}
            <button
              className="w-full py-3 px-6 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
              disabled={product.stock <= 0}
            >
              {product.stock > 0 ? t("addToCart") : t("outOfStock")}
            </button>

            {/* Description */}
            {product.description && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h2 className="text-lg font-semibold mb-4">{t("description")}</h2>
                <div className="text-gray-600 whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs"
                    style={{ borderRadius: "var(--border-radius)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

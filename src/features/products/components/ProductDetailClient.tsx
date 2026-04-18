"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { IProduct, IProductVariant } from "../types";
import type { IStoreSocialOrdering } from "@/features/stores/types";
import { ProductImageGallery } from "./ProductImageGallery";
import { AddToCartSection } from "./AddToCartSection";
import { SocialOrderButtons } from "./SocialOrderButtons";
import { t } from "@/shared/lib/i18n";
import { useTrackEvent } from "@/features/analytics/hooks/useTrackEvent";

interface ProductDetailClientProps {
  product: IProduct;
  socialOrdering?: IStoreSocialOrdering;
  productUrl?: string;
}

export function ProductDetailClient({ product, socialOrdering, productUrl }: ProductDetailClientProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const [activeVariant, setActiveVariant] = useState<IProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const track = useTrackEvent();

  useEffect(() => {
    track({
      eventType: "product_view",
      productId: product._id,
      productName: t(product.name, locale) || product._id,
      categoryId: product.categoryId ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const galleryImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product.images;

  const displayPrice = activeVariant?.price ?? product.price;
  const displayStock = activeVariant?.stock ?? product.stock;
  const displayCompareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;

  const hasDiscount = displayCompareAt > 0 && displayCompareAt > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Images */}
      <ProductImageGallery
        images={galleryImages}
        thumbnail={activeVariant?.images?.length ? undefined : product.thumbnail}
        productName={t(product.name, locale)}
      />

      {/* Product Info */}
      <div className="animate-fade-in-up">
        {/* Discount badge */}
        {hasDiscount && (
          <span
            className="inline-block px-3 py-1 text-xs font-bold rounded-full mb-4"
            style={{
              backgroundColor: "var(--color-sale-badge-bg)",
              color: "var(--color-sale-badge-text)",
            }}
          >
            {tr("save") || "Save"} {discountPercent}%
          </span>
        )}

        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4 leading-tight">
          {t(product.name, locale)}
        </h1>

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.round(product.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-300 text-gray-300 dark:fill-gray-600 dark:text-gray-600"
                  }
                />
              ))}
            </div>
            <span className="text-xs text-text-secondary">
              ({product.reviewCount} {tr("reviews")})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <span
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "var(--color-price)" }}
          >
            ৳{displayPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xl text-text-tertiary line-through">
              ৳{displayCompareAt.toLocaleString()}
            </span>
          )}
        </div>

        {t(product.shortDescription, locale) && (
          <p className="text-text-secondary leading-relaxed mb-6">
            {t(product.shortDescription, locale)}
          </p>
        )}

        <div className="border-t border-border-subtle pt-6 space-y-6">
          {/* Stock */}
          <div>
            {displayStock > 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600 font-medium">
                  {tr("inStock", { available: displayStock })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm text-red-600 font-medium">
                  {tr("outOfStock")}
                </span>
              </div>
            )}
          </div>

          <AddToCartSection
            productId={product._id}
            productName={t(product.name, locale)}
            productSlug={product.slug}
            thumbnail={product.thumbnail}
            price={product.price}
            stock={product.stock}
            options={product.options ?? []}
            variants={product.variants ?? []}
            addToCartLabel={tr("addToCart")}
            outOfStockLabel={tr("outOfStock")}
            onVariantChange={setActiveVariant}
            onQuantityChange={setQuantity}
            onSelectedOptionsChange={setSelectedOptions}
            categoryId={product.categoryId ?? undefined}
          />

          {socialOrdering && productUrl && (
            <SocialOrderButtons
              socialOrdering={socialOrdering}
              productName={t(product.name, locale)}
              productPrice={displayPrice}
              productUrl={productUrl}
              quantity={quantity}
              selectedOptions={selectedOptions}
            />
          )}
        </div>
      </div>
    </div>
  );
}

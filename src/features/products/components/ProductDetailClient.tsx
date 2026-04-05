"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { IProduct, IProductVariant } from "../types";
import { ProductImageGallery } from "./ProductImageGallery";
import { AddToCartSection } from "./AddToCartSection";

interface ProductDetailClientProps {
  product: IProduct;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const t = useTranslations("productDetail");
  const [activeVariant, setActiveVariant] = useState<IProductVariant | null>(null);

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
            ৳{displayPrice.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xl text-gray-400 line-through">
              ৳{displayCompareAt.toLocaleString()}
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
            {displayStock > 0 ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600 font-medium">
                  {t("inStock", { available: displayStock })}
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
            options={product.options ?? []}
            variants={product.variants ?? []}
            addToCartLabel={t("addToCart")}
            outOfStockLabel={t("outOfStock")}
            onVariantChange={setActiveVariant}
          />
        </div>
      </div>
    </div>
  );
}

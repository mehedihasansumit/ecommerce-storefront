"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import type { IProduct, IProductImage } from "../types";
import type { IStoreSocialOrdering } from "@/features/stores/types";
import { ProductImageGallery } from "./ProductImageGallery";
import { AddToCartSection } from "./AddToCartSection";
import { MobileBuyBar } from "./MobileBuyBar";
import { SocialOrderButtons } from "./SocialOrderButtons";
import { BulkPricingTable } from "./BulkPricingTable";
import { t } from "@/shared/lib/i18n";
import { useTrackEvent } from "@/features/analytics/hooks/useTrackEvent";
import { useProductSelection } from "../hooks/useProductSelection";
import { getBulkLineTotal, normalizeTiers } from "@/shared/lib/pricing";

interface ProductDetailClientProps {
  product: IProduct;
  socialOrdering?: IStoreSocialOrdering;
  productUrl?: string;
}

export function ProductDetailClient({ product, socialOrdering, productUrl }: ProductDetailClientProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const selection = useProductSelection(product);
  const { activeVariant, quantity, selectedOptions, displayPrice, displayStock, setOptions } =
    selection;
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

  // Unified gallery: product images first, then every variant's images, deduped by url.
  // Each image is tagged with the variant optionValues it belongs to (null = product-level)
  // so clicking a variant image can auto-select that variant.
  const { galleryImages, optionValuesByIndex } = useMemo(() => {
    const images: IProductImage[] = [];
    const optionValuesByIndex: (Record<string, string> | null)[] = [];
    const seen = new Set<string>();
    const push = (img: IProductImage, ov: Record<string, string> | null) => {
      if (!img?.url || seen.has(img.url)) return;
      seen.add(img.url);
      images.push(img);
      optionValuesByIndex.push(ov);
    };
    (product.images ?? []).forEach((img) => push(img, null));
    (product.variants ?? []).forEach((v) =>
      (v.images ?? []).forEach((img) => push(img, v.optionValues))
    );
    return { galleryImages: images, optionValuesByIndex };
  }, [product.images, product.variants]);

  const [galleryIndex, setGalleryIndex] = useState(0);

  const matchesVariant = (
    ov: Record<string, string> | null,
    target: Record<string, string>
  ) => !!ov && Object.entries(target).every(([k, val]) => ov[k] === val);

  // Variant chosen via chips → move the hero image to that variant's first image, unless
  // the current image already belongs to it (avoids jumping between its images). Done as an
  // "adjust state during render" sync (no effect) keyed on the active variant changing.
  const [prevVariantKey, setPrevVariantKey] = useState<string | null>(null);
  const variantKey = activeVariant ? JSON.stringify(activeVariant.optionValues) : null;
  if (variantKey !== prevVariantKey) {
    setPrevVariantKey(variantKey);
    if (
      activeVariant &&
      !matchesVariant(optionValuesByIndex[galleryIndex], activeVariant.optionValues)
    ) {
      const idx = optionValuesByIndex.findIndex((ov) =>
        matchesVariant(ov, activeVariant.optionValues)
      );
      if (idx >= 0) setGalleryIndex(idx);
    }
  }

  const displayCompareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;

  const hasDiscount = displayCompareAt > 0 && displayCompareAt > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100)
    : 0;

  const tiers = normalizeTiers(product.pricingTiers);
  const hasTiers = tiers.length > 0;
  // Tiers always use product.price as base (variant price overrides are ignored
  // for tier math so the bundle total remains consistent across mixed variants).
  const previewLineTotal = hasTiers
    ? getBulkLineTotal(product.price, quantity, tiers)
    : displayPrice * quantity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Images */}
      <ProductImageGallery
        images={galleryImages}
        thumbnail={optionValuesByIndex[0] === null ? product.thumbnail : undefined}
        productName={t(product.name, locale)}
        selectedIndex={galleryIndex}
        onSelect={(i) => {
          setGalleryIndex(i);
          const ov = optionValuesByIndex[i];
          if (ov) setOptions(ov);
        }}
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
                      : "fill-border-subtle text-border-subtle dark:fill-text-tertiary dark:text-text-tertiary"
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

        {hasTiers && (
          <div className="mb-6">
            <BulkPricingTable
              tiers={tiers}
              basePrice={product.price}
              currentQuantity={quantity}
            />
            <p className="mt-3 text-sm text-text-secondary">
              <span className="font-medium text-[var(--color-text)]">
                ৳{previewLineTotal.toLocaleString()}
              </span>{" "}
              for {quantity} {quantity === 1 ? "piece" : "pieces"}
            </p>
          </div>
        )}

        <div className="border-t border-border-subtle pt-6 space-y-6">
          {/* Stock */}
          <div>
            {displayStock > 0 ? (
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: "var(--color-success)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--color-success)" }}>
                  {tr("inStock", { available: displayStock })}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: "var(--color-error)" }}
                />
                <span className="text-sm font-medium" style={{ color: "var(--color-error)" }}>
                  {tr("outOfStock")}
                </span>
              </div>
            )}
          </div>

          {/* Desktop: inline selector + social buttons */}
          <div className="hidden md:block space-y-6">
            <AddToCartSection
              options={product.options ?? []}
              selection={selection}
              addToCartLabel={tr("addToCart")}
              outOfStockLabel={tr("outOfStock")}
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

      {/* Mobile: sticky buy bar + variant sheet */}
      <MobileBuyBar
        product={product}
        selection={selection}
        socialOrdering={socialOrdering}
        productUrl={productUrl}
        addToCartLabel={tr("addToCart")}
        outOfStockLabel={tr("outOfStock")}
        selectOptionsLabel={tr("selectOptions")}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { IProduct } from "../types";
import { getProductSwatches } from "../swatch-colors";
import { formatNumber, t } from "@/shared/lib/i18n";
import { StoreImage } from "@/shared/components/ui";
import { useCategoryName } from "@/shared/context/CategoryNamesContext";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const CARD_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

/** Everything both card styles derive from a product, computed one way. */
export function useProductCardData(product: IProduct) {
  const locale = useLocale();
  const categoryName = useCategoryName(product.categoryId);
  // Snapshot "now" once per mount (Date.now() in render is impure).
  const [now] = useState(() => Date.now());

  const hasDiscount = product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const soldOut = product.stock <= 0;
  const isNew = Boolean(product.createdAt) && now - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;

  return {
    name: t(product.name, locale),
    category: categoryName ? t(categoryName, locale) : "",
    hasDiscount,
    discountPercent: hasDiscount
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0,
    soldOut,
    isLowStock: product.stock > 0 && product.stock <= 5,
    /** One label at most: sold out, then sale, then new. */
    badge: soldOut ? "soldOut" : hasDiscount ? "sale" : isNew ? "new" : null,
    swatches: getProductSwatches(product),
  } as const;
}

/**
 * The card photograph. With a second image, hovering (mouse devices only) cross-fades
 * to it — usually the back or a detail shot. Phones never download the second image:
 * it is display:none there, and lazy images that are not displayed are not fetched.
 */
export function ProductCardMedia({
  product,
  name,
  imageClassName,
}: {
  product: IProduct;
  name: string;
  imageClassName: string;
}) {
  const tr = useTranslations("productCard");
  // A product whose photos are all tied to a variant (e.g. one gallery per colour) has
  // no product-level images; use the first variant photo so the card still gets its
  // small srcSet sizes instead of the full-size thumbnail. Its alt describes the
  // variant ("Away"), so the card keeps the product name as alt.
  const variantPhoto = product.variants.find((v) => v.images?.length)?.images[0];
  const src = product.thumbnail || product.images[0]?.url || variantPhoto?.url;
  const first =
    product.images[0] ?? (variantPhoto && variantPhoto.url === src ? variantPhoto : undefined);
  const second = product.images[1];

  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-text-tertiary">
        {tr("noImage")}
      </div>
    );
  }

  return (
    <>
      <StoreImage
        src={src}
        variants={first?.variants}
        blurDataURL={first?.blurDataURL}
        alt={(product.images[0]?.alt) || name}
        fill
        sizes={CARD_SIZES}
        className={imageClassName}
      />
      {second && second.url !== src && (
        <div
          aria-hidden
          className="absolute inset-0 hidden opacity-0 transition-opacity duration-500 ease-(--ease-out-expo) [@media(hover:hover)]:block group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          <StoreImage
            src={second.url}
            variants={second.variants}
            blurDataURL={second.blurDataURL}
            alt=""
            fill
            sizes={CARD_SIZES}
            className={imageClassName}
          />
        </div>
      )}
    </>
  );
}

/** Top-start label on the photograph: sold out, sale % or new. */
export function ProductCardBadge({
  badge,
  discountPercent,
}: {
  badge: "soldOut" | "sale" | "new" | null;
  discountPercent: number;
}) {
  const tr = useTranslations("productCard");
  if (!badge) return null;
  const style =
    badge === "soldOut"
      ? { backgroundColor: "var(--color-text)", color: "var(--color-bg)" }
      : badge === "sale"
        ? { backgroundColor: "var(--color-sale-badge-bg)", color: "var(--color-sale-badge-text)" }
        : { backgroundColor: "var(--color-card-bg)", color: "var(--color-text)" };
  return (
    <span
      className="absolute top-2.5 start-2.5 z-10 px-2 py-1 text-[11px] font-semibold leading-none tabular-nums"
      style={{ ...style, borderRadius: "calc(var(--border-radius) * 0.6)" }}
    >
      {badge === "soldOut"
        ? tr("outOfStock")
        : badge === "sale"
          ? tr("discount", { percent: discountPercent })
          : tr("new")}
    </span>
  );
}

/** Small uppercase category line above the name. Always reserves its row. */
export function ProductCardCategory({ category }: { category: string }) {
  return (
    <p className="min-h-4 text-[11px] font-medium uppercase tracking-[0.08em] leading-4 text-text-tertiary truncate">
      {category}
    </p>
  );
}

/**
 * Colour dots (start) and the rating (end) on one row. The row always reserves its
 * height, so cards — and their loading skeleton — keep one height either way.
 */
export function ProductCardMeta({
  product,
  swatches,
}: {
  product: IProduct;
  swatches: ReturnType<typeof getProductSwatches>;
}) {
  const tr = useTranslations("productCard");
  const locale = useLocale();
  const rating = formatNumber(product.averageRating, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const extra = swatches ? swatches.total - swatches.dots.length : 0;

  return (
    <div className="flex min-h-4 items-center justify-between gap-2">
      {swatches && swatches.dots.length === 0 ? (
        // None of the colour names are known: say how many instead of drawing "+N".
        <span className="text-[11px] text-text-secondary">{tr("colours", { count: swatches.total })}</span>
      ) : swatches ? (
        <span className="inline-flex items-center gap-1" role="img" aria-label={tr("colours", { count: swatches.total })}>
          {swatches.dots.map((d) => (
            <span
              key={d.name}
              aria-hidden
              title={d.name}
              className="size-3 rounded-full ring-1 ring-inset ring-black/15"
              style={{ backgroundColor: d.color }}
            />
          ))}
          {extra > 0 && (
            <span aria-hidden className="ms-0.5 text-[11px] text-text-secondary tabular-nums">
              +{formatNumber(extra, locale)}
            </span>
          )}
        </span>
      ) : null}
      {product.averageRating > 0 && (
        <span
          className="inline-flex items-center gap-1 text-xs text-text-secondary tabular-nums"
          role="img"
          aria-label={tr("rating", { rating })}
        >
          <Star size={12} aria-hidden className="fill-current" style={{ color: "var(--color-rating, var(--color-accent))" }} />
          <span aria-hidden>
            {rating} ({formatNumber(product.reviewCount, locale)})
          </span>
        </span>
      )}
    </div>
  );
}

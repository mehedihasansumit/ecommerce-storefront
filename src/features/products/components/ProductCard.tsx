"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Eye } from "lucide-react";
import type { IProduct } from "../types";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber, t } from "@/shared/lib/i18n";
import { Price, StoreImage } from "@/shared/components/ui";
import { useTenant } from "@/shared/hooks/useTenant";
import { DEFAULT_CURRENCY } from "@/shared/lib/constants";
import { useStoreStyles } from "@/shared/hooks/useStoreStyles";
import { EditorialProductCard } from "./EditorialProductCard";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/** Product card in the Store's productCardStyle Style Switch. */
export function ProductCard({ product }: { product: IProduct }) {
  const { productCardStyle } = useStoreStyles();
  if (productCardStyle === "boxed") return <BoxedProductCard product={product} />;
  return <EditorialProductCard product={product} plate={productCardStyle === "plate"} />;
}

/** productCardStyle "boxed" (base): bordered square card on the card colour. */
function BoxedProductCard({ product }: { product: IProduct }) {
  const tr = useTranslations("productCard");
  const tenant = useTenant();
  const locale = useLocale();
  const productName = t(product.name, locale);

  const hasDiscount =
    product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  // Snapshot "now" once per mount (Date.now() in render is impure).
  const [now] = useState(() => Date.now());
  const isNew =
    product.createdAt &&
    now - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const currency = tenant?.payment?.currency || DEFAULT_CURRENCY;
  const rating = Math.round(product.averageRating * 10) / 10;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="focus-ring group relative flex flex-col overflow-hidden border border-border-subtle transition-shadow duration-300 ease-(--ease-out-expo) hover:shadow-[var(--shadow-md)]"
      style={{ backgroundColor: "var(--color-card-bg)", borderRadius: "var(--border-radius)" }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface">
        {product.thumbnail || product.images[0]?.url ? (
          <StoreImage
            src={product.thumbnail || product.images[0].url}
            variants={product.images[0]?.variants}
            blurDataURL={product.images[0]?.blurDataURL}
            alt={product.images[0]?.alt || productName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="media-dim object-cover transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary">
            <Eye size={32} aria-hidden />
            <span className="sr-only">{tr("noImage")}</span>
          </div>
        )}

        {/* One badge at most: discount wins over "new" */}
        {(hasDiscount || isNew) && (
          <span
            className="absolute top-2.5 left-2.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] leading-none"
            style={
              hasDiscount
                ? {
                    backgroundColor: "var(--color-sale-badge-bg)",
                    color: "var(--color-sale-badge-text)",
                    borderRadius: "calc(var(--border-radius) * 0.75)",
                  }
                : {
                    backgroundColor: "var(--color-card-bg)",
                    color: "var(--color-text)",
                    borderRadius: "calc(var(--border-radius) * 0.75)",
                  }
            }
          >
            {hasDiscount ? tr("discount", { percent: discountPercent }) : tr("new")}
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
              {tr("outOfStock")}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.75em] text-[var(--color-text)]">
          {productName}
        </h3>

        {/* Always reserves the row, so cards (and their loading skeleton) keep one
            height whether or not the product has reviews yet. */}
        <div className="flex items-center gap-1.5 min-h-4">
          {product.averageRating > 0 && (
            <>
              <span className="flex items-center gap-0.5" role="img" aria-label={tr("rating", { rating: formatNumber(rating, locale, { maximumFractionDigits: 1 }) })}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    aria-hidden
                    className={i < Math.round(product.averageRating) ? "fill-current" : "fill-none opacity-40"}
                    style={{ color: "var(--color-rating, var(--color-accent))" }}
                  />
                ))}
              </span>
              <span className="text-xs text-text-secondary">({formatNumber(product.reviewCount, locale)})</span>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
          <Price
            amount={product.price}
            compareAt={hasDiscount ? product.compareAtPrice : undefined}
            currency={currency}
            locale={locale}
            size="md"
          />
          {isLowStock && (
            <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--color-link)" }}>
              {tr("onlyLeft", { count: product.stock })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

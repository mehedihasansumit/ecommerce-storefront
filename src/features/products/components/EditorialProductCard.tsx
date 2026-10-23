"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { IProduct } from "../types";
import { formatNumber, t } from "@/shared/lib/i18n";
import { Price, StoreImage } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * productCardStyle "editorial" (frontend-design / taste-skill Variants): a 4:5 portrait
 * image straight on the page with quiet type underneath, no box.
 * "plate" (impeccable Variant) is the same card with the photograph settled into the
 * page at night (.plate-photo) and the sold-out state as a label instead of a veil.
 */
export function EditorialProductCard({ product, plate }: { product: IProduct; plate: boolean }) {
  const tr = useTranslations("productCard");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const productName = t(product.name, locale);

  const hasDiscount = product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  // Snapshot "now" once per mount (Date.now() in render is impure).
  const [now] = useState(() => Date.now());
  const isNew = product.createdAt && now - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const soldOut = product.stock <= 0;
  const image = product.thumbnail || product.images[0]?.url;
  const rating = formatNumber(product.averageRating, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const labelRadius = "calc(var(--border-radius) * 0.6)";

  const badge = plate && soldOut ? "soldOut" : hasDiscount ? "sale" : isNew ? "new" : null;

  return (
    <Link href={`/products/${product.slug}`} className="focus-ring group relative block" style={{ borderRadius: "var(--border-radius)" }}>
      <div
        className="relative aspect-[4/5] overflow-hidden bg-surface"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {image ? (
          <StoreImage
            src={image}
            variants={product.images[0]?.variants}
            blurDataURL={product.images[0]?.blurDataURL}
            alt={product.images[0]?.alt || productName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-[transform,filter] duration-700 ease-(--ease-out-expo) group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
              plate ? `plate-photo ${soldOut ? "opacity-60" : ""}` : "media-dim"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-tertiary">
            <Eye size={28} aria-hidden />
            <span className="sr-only">{tr("noImage")}</span>
          </div>
        )}

        {badge && (
          <span
            className="absolute top-2.5 start-2.5 px-2 py-1 text-[11px] font-semibold leading-none tabular-nums"
            style={
              badge === "soldOut"
                ? { backgroundColor: "var(--color-text)", color: "var(--color-bg)", borderRadius: labelRadius }
                : badge === "sale"
                  ? { backgroundColor: "var(--color-sale-badge-bg)", color: "var(--color-sale-badge-text)", borderRadius: labelRadius }
                  : { backgroundColor: "var(--color-card-bg)", color: "var(--color-text)", borderRadius: labelRadius }
            }
          >
            {badge === "soldOut"
              ? tr("outOfStock")
              : badge === "sale"
                ? tr("discount", { percent: discountPercent })
                : tr("new")}
          </span>
        )}

        {!plate && soldOut && (
          <div className="absolute inset-0 bg-bg/60 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">{tr("outOfStock")}</span>
          </div>
        )}
      </div>

      <div className="pt-3 pb-1 px-0.5">
        <h3
          className={`text-sm md:text-[15px] font-medium leading-snug line-clamp-2 min-h-[2.75em] text-text transition-colors duration-150 ${
            plate ? "group-hover:text-primary" : "group-hover:text-[var(--color-link)]"
          }`}
        >
          {productName}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Price
            amount={product.price}
            compareAt={hasDiscount ? product.compareAtPrice : undefined}
            currency={currency}
            locale={locale}
            size="sm"
          />
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
        {isLowStock && (
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--color-link)" }}>
            {tr("onlyLeft", { count: product.stock })}
          </p>
        )}
      </div>
    </Link>
  );
}

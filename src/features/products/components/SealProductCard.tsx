"use client";

import Link from "next/link";
import { Banknote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { IProduct } from "../types";
import { formatNumber } from "@/shared/lib/i18n";
import { Price } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import { isSizeOption } from "./SizeGuide";
import { ProductCardBadge, ProductCardMedia, useProductCardData } from "./ProductCardParts";

/**
 * The sizes a shopper can still buy. With variants, a size counts when any variant of
 * it has stock; without variants, every listed size counts while the product has stock.
 */
export function sizesInStock(product: IProduct): string[] {
  const option = product.options?.find((o) => isSizeOption(o.name));
  if (!option) return [];
  if (product.variants.length === 0) return product.stock > 0 ? option.values : [];
  return option.values.filter((size) =>
    product.variants.some((v) => v.optionValues?.[option.name] === size && v.stock > 0)
  );
}

/**
 * productCardStyle "seal": the gallery card (photo on the page, serif name, no box)
 * with the discount as a wax seal on the photo's top corner, then the sizes in stock
 * and "Cash on delivery", so a phone shopper knows before opening the product.
 */
export function SealProductCard({ product }: { product: IProduct }) {
  const tr = useTranslations("productCard");
  const tt = useTranslations("trust");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const card = useProductCardData(product);
  const sizes = card.soldOut ? [] : sizesInStock(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="focus-ring group relative block @container"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface" style={{ borderRadius: "var(--border-radius)" }}>
        <ProductCardMedia
          product={product}
          name={card.name}
          imageClassName={`media-dim object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            card.soldOut ? "opacity-60" : ""
          }`}
        />
        {card.soldOut ? (
          <ProductCardBadge badge="soldOut" discountPercent={0} />
        ) : card.hasDiscount ? (
          <span className="pc-seal" aria-hidden>
            <span>
              <b>{formatNumber(card.discountPercent, locale)}%</b>
              <small>{tr("sealOff")}</small>
            </span>
          </span>
        ) : null}
      </div>

      <div className="grid gap-1 px-0.5 pt-3 pb-1">
        <h3 className="font-display line-clamp-2 min-h-[2.5em] text-[15px] leading-tight font-semibold text-text transition-colors duration-150 group-hover:text-primary @[200px]:text-[17px]">
          {card.name}
        </h3>
        <div>
          <Price
            amount={product.price}
            compareAt={card.hasDiscount ? product.compareAtPrice : undefined}
            currency={currency}
            locale={locale}
            size="sm"
          />
          {card.hasDiscount && (
            <span className="sr-only">{tr("discount", { percent: card.discountPercent })}</span>
          )}
        </div>
        {sizes.length > 0 && (
          <p className="pc-sizes mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs font-semibold text-text">
            <span className="sr-only">{tr("sizesInStock")}: </span>
            {sizes.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Banknote size={15} strokeWidth={1.5} aria-hidden className="shrink-0" style={{ color: "var(--color-accent)" }} />
          {tt("codShort")}
        </p>
      </div>
    </Link>
  );
}

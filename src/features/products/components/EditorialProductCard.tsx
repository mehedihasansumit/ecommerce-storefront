"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { IProduct } from "../types";
import { Price } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import {
  ProductCardBadge,
  ProductCardCategory,
  ProductCardMedia,
  ProductCardMeta,
  useProductCardData,
} from "./ProductCardParts";

/**
 * productCardStyle "editorial" (frontend-design / taste-skill Variants): a 4:5 portrait
 * image straight on the page with quiet type underneath, no box.
 * "plate" (impeccable Variant) is the same card with the photograph settled into the
 * page at night (.plate-photo).
 */
export function EditorialProductCard({ product, plate }: { product: IProduct; plate: boolean }) {
  const tr = useTranslations("productCard");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const card = useProductCardData(product);

  return (
    <Link href={`/products/${product.slug}`} className="focus-ring group relative block" style={{ borderRadius: "var(--border-radius)" }}>
      <div
        className="relative aspect-[4/5] overflow-hidden bg-surface"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <ProductCardMedia
          product={product}
          name={card.name}
          imageClassName={`object-cover transition-[transform,filter] duration-700 ease-(--ease-out-expo) group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            plate ? "plate-photo" : "media-dim"
          } ${card.soldOut ? "opacity-60" : ""}`}
        />
        <ProductCardBadge badge={card.badge} discountPercent={card.discountPercent} />
      </div>

      <div className="pt-3 pb-1 px-0.5">
        <ProductCardCategory category={card.category} />
        <h3
          className={`mt-0.5 text-sm md:text-[15px] font-medium leading-snug line-clamp-2 min-h-[2.75em] text-text transition-colors duration-150 ${
            plate ? "group-hover:text-primary" : "group-hover:text-[var(--color-link)]"
          }`}
        >
          {card.name}
        </h3>
        <div className="mt-1.5">
          <ProductCardMeta product={product} swatches={card.swatches} />
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Price
            amount={product.price}
            compareAt={card.hasDiscount ? product.compareAtPrice : undefined}
            currency={currency}
            locale={locale}
            size="sm"
          />
          {card.isLowStock && (
            <span className="text-xs font-medium" style={{ color: "var(--color-link)" }}>
              {tr("onlyLeft", { count: product.stock })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

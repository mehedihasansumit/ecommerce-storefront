"use client";

import { Link } from "@/i18n/navigation";
import type { IProduct } from "../types";
import { useTranslations, useLocale } from "next-intl";
import { Price } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import { useStoreStyles } from "@/shared/hooks/useStoreStyles";
import { EditorialProductCard } from "./EditorialProductCard";
import { SealProductCard } from "./SealProductCard";
import {
  ProductCardBadge,
  ProductCardCategory,
  ProductCardMedia,
  ProductCardMeta,
  useProductCardData,
} from "./ProductCardParts";

/** Product card in the Store's productCardStyle Style Switch. */
export function ProductCard({ product }: { product: IProduct }) {
  const { productCardStyle } = useStoreStyles();
  if (productCardStyle === "boxed") return <BoxedProductCard product={product} />;
  if (productCardStyle === "seal") return <SealProductCard product={product} />;
  return <EditorialProductCard product={product} plate={productCardStyle === "plate"} />;
}

/** productCardStyle "boxed" (base): bordered card on the card colour, 4:5 photograph. */
function BoxedProductCard({ product }: { product: IProduct }) {
  const tr = useTranslations("productCard");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const card = useProductCardData(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="focus-ring group relative flex flex-col overflow-hidden border border-border-subtle transition-[box-shadow,transform] duration-300 ease-(--ease-out-expo) hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] motion-reduce:hover:translate-y-0"
      style={{ backgroundColor: "var(--color-card-bg)", borderRadius: "var(--border-radius)" }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
        <ProductCardMedia
          product={product}
          name={card.name}
          imageClassName={`media-dim object-cover transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            card.soldOut ? "opacity-60" : ""
          }`}
        />
        <ProductCardBadge badge={card.badge} discountPercent={card.discountPercent} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <div>
          <ProductCardCategory category={card.category} />
          <h3 className="mt-0.5 text-sm font-medium leading-snug line-clamp-2 min-h-[2.75em] text-[var(--color-text)]">
            {card.name}
          </h3>
        </div>

        <ProductCardMeta product={product} swatches={card.swatches} />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
          <Price
            amount={product.price}
            compareAt={card.hasDiscount ? product.compareAtPrice : undefined}
            currency={currency}
            locale={locale}
            size="md"
          />
          {card.isLowStock && (
            <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--color-link)" }}>
              {tr("onlyLeft", { count: product.stock })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

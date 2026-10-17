"use client";

import type { ReactNode, Ref } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { IProductOption } from "../types";
import type { ProductSelection } from "../hooks/useProductSelection";
import { Button, formatPrice } from "@/shared/components/ui";
import { VariantOptions } from "./VariantOptions";

/** Anchor id of the option chips, so the sticky bar can scroll the shopper back to them. */
export const PRODUCT_OPTIONS_ID = "product-options";

interface AddToCartSectionProps {
  options: IProductOption[];
  selection: ProductSelection;
  /** Rendered between the option chips and the CTA row (delivery / COD / returns rows). */
  beforeCta?: ReactNode;
  /** Attached to the CTA row; the mobile sticky bar shows once it scrolls out of view. */
  ctaRef?: Ref<HTMLDivElement>;
}

/**
 * Inline variant selector + quantity + add-to-cart, on every breakpoint. Controlled by the
 * shared useProductSelection hook (state lives in ProductDetailClient), so the mobile sticky
 * bar and this section never desync.
 */
export function AddToCartSection({ options, selection, beforeCta, ctaRef }: AddToCartSectionProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const {
    selectedOptions,
    setOption,
    quantity,
    setQuantity,
    displayPrice,
    displayStock,
    isValueAvailable,
    tryAddToCart,
  } = selection;
  const outOfStock = displayStock <= 0;

  return (
    <div className="space-y-6">
      <div id={PRODUCT_OPTIONS_ID} className="scroll-mt-24">
        <VariantOptions
          options={options}
          selectedOptions={selectedOptions}
          onSelect={setOption}
          isValueAvailable={isValueAvailable}
        />
      </div>

      {beforeCta}

      {/* Quantity + Add to Cart */}
      <div ref={ctaRef} className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center self-start border border-border-subtle shadow-[var(--shadow-xs)] shrink-0"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={tr("decreaseQuantity")}
            className="focus-ring px-4 py-3 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span
            aria-live="polite"
            className="px-5 py-3 font-semibold text-sm min-w-[3rem] text-center border-x border-border-subtle"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
            disabled={quantity >= displayStock}
            aria-label={tr("increaseQuantity")}
            className="focus-ring px-4 py-3 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Never disabled for a missing size: tapping explains what's missing instead. */}
        <Button
          variant="brand"
          size="xl"
          className="flex-1"
          leftIcon={<ShoppingCart size={18} aria-hidden />}
          onClick={tryAddToCart}
          disabled={outOfStock}
        >
          {outOfStock
            ? tr("outOfStock")
            : `${tr("addToCart")} · ${formatPrice(displayPrice, "BDT", locale)}`}
        </Button>
      </div>
    </div>
  );
}

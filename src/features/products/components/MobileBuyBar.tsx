"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { useLocale } from "next-intl";
import { BottomSheet } from "@/shared/components/ui";
import { t } from "@/shared/lib/i18n";
import type { IProduct } from "../types";
import type { ProductSelection } from "../hooks/useProductSelection";
import type { IStoreSocialOrdering } from "@/features/stores/types";
import { VariantOptions } from "./VariantOptions";
import { SocialOrderButtons } from "./SocialOrderButtons";

interface MobileBuyBarProps {
  product: IProduct;
  selection: ProductSelection;
  socialOrdering?: IStoreSocialOrdering;
  productUrl?: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  selectOptionsLabel: string;
}

/**
 * Mobile-only sticky purchase bar pinned above the bottom nav. Tapping it opens a
 * bottom sheet with the variant options, quantity and a confirm add-to-cart, so the
 * shopper never has to scroll past the image/description to pick a variant or buy.
 */
export function MobileBuyBar({
  product,
  selection,
  socialOrdering,
  productUrl,
  addToCartLabel,
  outOfStockLabel,
  selectOptionsLabel,
}: MobileBuyBarProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const {
    selectedOptions,
    setOption,
    quantity,
    setQuantity,
    displayPrice,
    displayStock,
    activeVariant,
    hasOptions,
    isValueAvailable,
    addToCart,
  } = selection;

  const options = product.options ?? [];
  const productName = t(product.name, locale);
  const displayCompareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const hasDiscount = displayCompareAt > 0 && displayCompareAt > displayPrice;
  const outOfStock = displayStock <= 0;

  function confirmAddToCart() {
    if (outOfStock) return;
    addToCart();
    setOpen(false);
    toast.success(`${addToCartLabel} ✓`);
  }

  function handleBarClick() {
    if (outOfStock) return;
    // With options the shopper must pick a variant first → open the sheet.
    // Without options, add straight to cart.
    if (hasOptions) setOpen(true);
    else confirmAddToCart();
  }

  return (
    <>
      {/* Sticky bar */}
      <div
        className="fixed inset-x-0 z-40 md:hidden border-t border-border-subtle shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{
          bottom: "calc(3.5rem + env(safe-area-inset-bottom))",
          backgroundColor: "var(--color-card-bg)",
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span
                className="text-lg font-bold leading-none"
                style={{ color: "var(--color-price)" }}
              >
                ৳{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-text-tertiary line-through">
                  ৳{displayCompareAt.toLocaleString()}
                </span>
              )}
            </div>
            {hasOptions && (
              <p className="text-[11px] text-text-tertiary mt-0.5 truncate">
                {Object.values(selectedOptions).filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleBarClick}
            disabled={outOfStock}
            className="flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold text-sm shrink-0 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <ShoppingCart size={18} />
            {outOfStock ? outOfStockLabel : hasOptions ? selectOptionsLabel : addToCartLabel}
          </button>
        </div>
      </div>

      {/* Variant sheet */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title={productName}>
        <div className="space-y-5 pb-2">
          <VariantOptions
            options={options}
            selectedOptions={selectedOptions}
            onSelect={setOption}
            isValueAvailable={isValueAvailable}
          />

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Qty
            </span>
            <div
              className="flex items-center border border-border-subtle shadow-[var(--shadow-xs)]"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-4 py-2.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="px-5 py-2.5 font-semibold text-sm min-w-[3rem] text-center border-x border-border-subtle">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
                disabled={quantity >= displayStock}
                className="px-4 py-2.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Confirm add to cart */}
          <button
            type="button"
            onClick={confirmAddToCart}
            disabled={outOfStock}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 text-white font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <ShoppingCart size={18} />
            {outOfStock ? outOfStockLabel : `${addToCartLabel} · ৳${displayPrice.toLocaleString()}`}
          </button>

          {socialOrdering && productUrl && (
            <SocialOrderButtons
              socialOrdering={socialOrdering}
              productName={productName}
              productPrice={displayPrice}
              productUrl={productUrl}
              quantity={quantity}
              selectedOptions={selectedOptions}
            />
          )}
        </div>
      </BottomSheet>
    </>
  );
}

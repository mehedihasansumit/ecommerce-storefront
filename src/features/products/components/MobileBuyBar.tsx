"use client";

import { useEffect, useState, type RefObject } from "react";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button, Price } from "@/shared/components/ui";
import { t } from "@/shared/lib/i18n";
import type { IProduct } from "../types";
import type { ProductSelection } from "../hooks/useProductSelection";
import { PRODUCT_OPTIONS_ID } from "./AddToCartSection";

interface MobileBuyBarProps {
  product: IProduct;
  selection: ProductSelection;
  /** The inline CTA row. The bar only shows once the shopper has scrolled past it. */
  anchorRef: RefObject<HTMLDivElement | null>;
}

/**
 * Mobile-only sticky purchase bar pinned above the bottom nav. Hidden while the inline
 * buy box is on screen (sizes and CTA are already visible there); slides in after the
 * shopper scrolls past it. With an option missing it scrolls back to the chips.
 */
export function MobileBuyBar({ product, selection, anchorRef }: MobileBuyBarProps) {
  const tr = useTranslations("productDetail");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);
  const { displayPrice, displayStock, activeVariant, missingOptions, tryAddToCart } = selection;

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      // Show only when the CTA has left through the top, not before reaching it.
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [anchorRef]);

  const outOfStock = displayStock <= 0;
  const compareAt = activeVariant?.compareAtPrice ?? product.compareAtPrice;

  function handleAdd() {
    if (outOfStock) return;
    if (!tryAddToCart() && missingOptions.length > 0) {
      document.getElementById(PRODUCT_OPTIONS_ID)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div
      // Stays mounted and slides (transition, not a replayed mount animation); inert when hidden.
      inert={!visible}
      aria-hidden={!visible}
      className={`fixed inset-x-0 z-40 md:hidden border-t border-border-subtle shadow-[0_-2px_12px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-(--ease-out-expo) ${
        visible ? "translate-y-0" : "translate-y-[calc(100%+3.5rem)]"
      }`}
      style={{
        bottom: "calc(3.5rem + env(safe-area-inset-bottom))",
        backgroundColor: "var(--color-card-bg)",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs text-text-secondary truncate">{t(product.name, locale)}</p>
          <Price amount={displayPrice} compareAt={compareAt} size="md" locale={locale} />
        </div>
        <Button
          variant="brand"
          size="lg"
          className="shrink-0"
          leftIcon={<ShoppingCart size={18} aria-hidden />}
          onClick={handleAdd}
          disabled={outOfStock}
        >
          {outOfStock ? tr("outOfStock") : tr("addToCart")}
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/shared/context/CartContext";
import { useTrackEvent } from "@/features/analytics/hooks/useTrackEvent";
import { getBulkUnitPrice, normalizeTiers } from "@/shared/lib/pricing";
import { t } from "@/shared/lib/i18n";
import { useLocale } from "next-intl";
import type { IProduct, IProductVariant } from "../types";

export interface ProductSelection {
  selectedOptions: Record<string, string>;
  setOption: (name: string, value: string) => void;
  setOptions: (values: Record<string, string>) => void;
  quantity: number;
  setQuantity: (updater: number | ((q: number) => number)) => void;
  activeVariant: IProductVariant | null;
  displayPrice: number;
  displayStock: number;
  hasOptions: boolean;
  isValueAvailable: (optionName: string, value: string) => boolean;
  addToCart: () => void;
}

/**
 * Single source of truth for variant/quantity selection on the product detail page.
 * Instantiated once in ProductDetailClient and shared by the desktop inline selector
 * and the mobile sticky bar + bottom sheet — so the two views never desync and the
 * URL-sync effect runs once.
 */
export function useProductSelection(product: IProduct): ProductSelection {
  const { addItem } = useCart();
  const track = useTrackEvent();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const options = useMemo(() => product.options ?? [], [product.options]);
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasOptions = options.length > 0;

  const [quantity, setQuantity] = useState(1);
  // Pre-select only from a valid URL param; otherwise leave unselected ("") so the
  // product thumbnail/images show by default (no variant forced) until the shopper picks.
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      options.map((o) => {
        const fromUrl = searchParams.get(o.name);
        const valid = fromUrl && o.values.includes(fromUrl) ? fromUrl : "";
        return [o.name, valid];
      })
    )
  );

  const setOption = useCallback((name: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setOptions = useCallback((values: Record<string, string>) => {
    setSelectedOptions((prev) => ({ ...prev, ...values }));
  }, []);

  const activeVariant = useMemo(() => {
    if (variants.length === 0 || options.length === 0) return null;
    return (
      variants.find((v) =>
        Object.entries(selectedOptions).every(([k, val]) => v.optionValues?.[k] === val)
      ) ?? null
    );
  }, [selectedOptions, variants, options]);

  const displayPrice = activeVariant?.price ?? product.price;
  const displayStock = activeVariant?.stock ?? product.stock;

  // Mirror variant selection into the URL query (?Color=Red&Size=M) without a server
  // round-trip or scroll jump, so the variant is shareable/bookmarkable.
  useEffect(() => {
    if (options.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    for (const o of options) {
      if (selectedOptions[o.name]) params.set(o.name, selectedOptions[o.name]);
      else params.delete(o.name);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [selectedOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const isValueAvailable = useCallback(
    (optionName: string, value: string): boolean => {
      if (variants.length === 0) return true;
      return variants.some(
        (v) =>
          v.optionValues?.[optionName] === value &&
          Object.entries(selectedOptions)
            .filter(([k]) => k !== optionName)
            .every(([k, val]) => v.optionValues?.[k] === val) &&
          (v.stock ?? 0) > 0
      );
    },
    [variants, selectedOptions]
  );

  const addToCart = useCallback(() => {
    if (displayStock <= 0) return;
    const resolvedThumbnail = activeVariant?.images?.[0]?.url || product.thumbnail;
    const tiers = normalizeTiers(product.pricingTiers);
    // Snapshot the tier-aware unit price using product.price as base (tiers override
    // variant price overrides for consistency). Cart context re-derives across all
    // variant lines for the same product on each render.
    const priceAtAdd =
      tiers.length > 0 ? getBulkUnitPrice(product.price, quantity, tiers) : displayPrice;
    addItem({
      productId: product._id,
      productName: t(product.name, locale),
      productSlug: product.slug,
      thumbnail: resolvedThumbnail,
      variantSelections: selectedOptions,
      quantity,
      priceAtAdd,
      pricingTiers: tiers,
      productBasePrice: product.price,
    });
    track({
      eventType: "add_to_cart",
      productId: product._id,
      productName: t(product.name, locale),
      categoryId: product.categoryId ?? undefined,
    });
  }, [
    activeVariant,
    displayPrice,
    displayStock,
    quantity,
    selectedOptions,
    product,
    locale,
    addItem,
    track,
  ]);

  return {
    selectedOptions,
    setOption,
    setOptions,
    quantity,
    setQuantity,
    activeVariant,
    displayPrice,
    displayStock,
    hasOptions,
    isValueAvailable,
    addToCart,
  };
}

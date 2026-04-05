"use client";

import { useState, useMemo, useEffect } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";
import type { IProductOption, IProductVariant } from "../types";

interface AddToCartSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  stock: number;
  options: IProductOption[];
  variants: IProductVariant[];
  addToCartLabel: string;
  outOfStockLabel: string;
  onVariantChange?: (variant: IProductVariant | null) => void;
}

export function AddToCartSection({
  productId,
  productName,
  productSlug,
  thumbnail,
  price,
  stock,
  options,
  variants,
  addToCartLabel,
  outOfStockLabel,
  onVariantChange,
}: AddToCartSectionProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () => Object.fromEntries(options.map((o) => [o.name, o.values[0] ?? ""]))
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const activeVariant = useMemo(() => {
    if (variants.length === 0 || options.length === 0) return null;
    return (
      variants.find((v) =>
        Object.entries(selectedOptions).every(
          ([k, val]) => v.optionValues?.[k] === val
        )
      ) ?? null
    );
  }, [selectedOptions, variants, options]);

  const displayPrice = activeVariant?.price ?? price;
  const displayStock = activeVariant?.stock ?? stock;

  useEffect(() => {
    onVariantChange?.(activeVariant);
  }, [activeVariant]); // eslint-disable-line react-hooks/exhaustive-deps

  function isValueAvailable(optionName: string, value: string): boolean {
    if (variants.length === 0) return true;
    return variants.some(
      (v) =>
        v.optionValues?.[optionName] === value &&
        Object.entries(selectedOptions)
          .filter(([k]) => k !== optionName)
          .every(([k, val]) => v.optionValues?.[k] === val) &&
        (v.stock ?? 0) > 0
    );
  }

  function handleAddToCart() {
    if (displayStock <= 0) return;
    addItem({
      productId,
      productName,
      productSlug,
      thumbnail,
      variantSelections: selectedOptions,
      quantity,
      priceAtAdd: displayPrice,
    });
    setMessage({ type: "success", text: "Added to cart!" });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Options */}
      {options.length > 0 && (
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.name}>
              <label className="block text-sm font-semibold mb-2.5 text-gray-700">
                {option.name}
                {selectedOptions[option.name] && (
                  <span className="font-normal text-gray-500 ml-1">
                    — {selectedOptions[option.name]}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const available = isValueAvailable(option.name, value);
                  const selected = selectedOptions[option.name] === value;
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))
                      }
                      disabled={!available}
                      className={`px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
                        selected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : available
                          ? "border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm"
                          : "border-gray-100 text-gray-300 cursor-not-allowed line-through"
                      }`}
                      style={{ borderRadius: "var(--border-radius)" }}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center border border-gray-200 shrink-0"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span className="px-5 py-3 font-semibold text-sm min-w-[3rem] text-center border-x border-gray-200">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
            disabled={quantity >= displayStock}
            className="px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 text-white font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
          disabled={displayStock <= 0}
        >
          <ShoppingCart size={18} />
          {displayStock > 0 ? addToCartLabel : outOfStockLabel}
        </button>
      </div>

      {message && (
        <div
          className={`text-sm font-medium px-4 py-2 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

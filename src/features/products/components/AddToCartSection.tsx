"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import type { IProductOption } from "../types";
import type { ProductSelection } from "../hooks/useProductSelection";
import { VariantOptions } from "./VariantOptions";

interface AddToCartSectionProps {
  options: IProductOption[];
  selection: ProductSelection;
  addToCartLabel: string;
  outOfStockLabel: string;
}

/**
 * Desktop inline variant selector + quantity + add-to-cart. Controlled by the shared
 * useProductSelection hook (state lives in ProductDetailClient). On mobile this is hidden
 * in favour of MobileBuyBar.
 */
export function AddToCartSection({
  options,
  selection,
  addToCartLabel,
  outOfStockLabel,
}: AddToCartSectionProps) {
  const {
    selectedOptions,
    setOption,
    quantity,
    setQuantity,
    displayStock,
    isValueAvailable,
    addToCart,
  } = selection;
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function handleAddToCart() {
    if (displayStock <= 0) return;
    addToCart();
    setMessage({ type: "success", text: "Added to cart!" });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      <VariantOptions
        options={options}
        selectedOptions={selectedOptions}
        onSelect={setOption}
        isValueAvailable={isValueAvailable}
      />

      {/* Quantity + Add to Cart */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center border border-border-subtle shadow-[var(--shadow-xs)] shrink-0"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-4 py-3 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
          >
            <Minus size={16} />
          </button>
          <span className="px-5 py-3 font-semibold text-sm min-w-[3rem] text-center border-x border-border-subtle">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(displayStock, q + 1))}
            disabled={quantity >= displayStock}
            className="px-4 py-3 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 text-white font-semibold transition-all duration-200 hover:brightness-105 hover:shadow-[var(--shadow-md)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
          className={`text-sm font-medium px-4 py-2 rounded-md animate-fade-in ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

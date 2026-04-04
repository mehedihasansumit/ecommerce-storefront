"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";

interface Variant {
  name: string;
  options: Array<{ value: string }>;
}

interface AddToCartSectionProps {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  price: number;
  stock: number;
  variants: Variant[];
  addToCartLabel: string;
  outOfStockLabel: string;
}

export function AddToCartSection({
  productId,
  productName,
  productSlug,
  thumbnail,
  price,
  stock,
  variants,
  addToCartLabel,
  outOfStockLabel,
}: AddToCartSectionProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    variants.forEach((v) => {
      if (v.options.length > 0) initial[v.name] = v.options[0].value;
    });
    return initial;
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleAddToCart() {
    if (stock <= 0) return;
    addItem({
      productId,
      productName,
      productSlug,
      thumbnail,
      variantSelections: selectedVariants,
      quantity,
      priceAtAdd: price,
    });
    setMessage({ type: "success", text: "Added to cart!" });
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Variants */}
      {variants.length > 0 && (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.name}>
              <label className="block text-sm font-semibold mb-2.5 text-gray-700">
                {variant.name}
              </label>
              <div className="flex flex-wrap gap-2">
                {variant.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setSelectedVariants((prev) => ({
                        ...prev,
                        [variant.name]: option.value,
                      }))
                    }
                    className={`px-4 py-2.5 border text-sm font-medium transition-all duration-200 hover:border-gray-400 ${
                      selectedVariants[variant.name] === option.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:shadow-sm"
                    }`}
                    style={{ borderRadius: "var(--border-radius)" }}
                  >
                    {option.value}
                  </button>
                ))}
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
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
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
          disabled={stock <= 0}
        >
          <ShoppingCart size={18} />
          {stock > 0 ? addToCartLabel : outOfStockLabel}
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

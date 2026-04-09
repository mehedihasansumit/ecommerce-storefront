"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";

interface CartItemRowProps {
  productId: string;
  productName: string;
  productSlug: string;
  thumbnail: string;
  priceAtAdd: number;
  quantity: number;
  variantSelections: Record<string, string>;
}

export function CartItemRow({
  productId,
  productName,
  productSlug,
  thumbnail,
  priceAtAdd,
  quantity,
  variantSelections,
}: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCart();
  const [qty, setQty] = useState(quantity);

  function handleUpdate(newQty: number) {
    setQty(Math.max(0, newQty));
    if (newQty <= 0) {
      removeItem(productId, variantSelections);
    } else {
      updateQuantity(productId, variantSelections, newQty);
    }
  }

  const variantEntries = Object.entries(variantSelections);

  return (
    <div className="flex gap-4 py-6 border-b border-gray-100 last:border-0">
      {/* Thumbnail */}
      <Link href={`/products/${productSlug}`} className="shrink-0">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden relative">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={productName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${productSlug}`}
          className="font-medium text-sm sm:text-base hover:underline line-clamp-2"
        >
          {productName}
        </Link>

        {variantEntries.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {variantEntries.map(([key, val]) => (
              <span key={key} className="text-[11px] text-gray-400 uppercase tracking-wide">
                {key}: <span className="font-medium text-gray-700">{val}</span>
              </span>
            ))}
          </div>
        )}

        <p
          className="mt-1 text-sm font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          ৳{priceAtAdd.toLocaleString()}
        </p>
      </div>

      {/* Quantity + Remove */}
      <div className="flex flex-col items-end justify-between gap-2 shrink-0">
        <button
          onClick={() => handleUpdate(0)}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={16} />
        </button>

        <div
          className="flex items-center border border-gray-200 shadow-[var(--shadow-xs)]"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          <button
            onClick={() => handleUpdate(qty - 1)}
            className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Minus size={14} />
          </button>
          <span className="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center border-x border-gray-200">
            {qty}
          </span>
          <button
            onClick={() => handleUpdate(qty + 1)}
            className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-800">
          ৳{(priceAtAdd * qty).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

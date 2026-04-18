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
    const next = Math.max(0, newQty);
    setQty(next);
    if (next <= 0) {
      removeItem(productId, variantSelections);
    } else {
      updateQuantity(productId, variantSelections, next);
    }
  }

  const variantEntries = Object.entries(variantSelections);

  return (
    <div className="flex gap-4 py-5 border-b border-border-subtle last:border-0">
      {/* Thumbnail */}
      <Link href={`/products/${productSlug}`} className="shrink-0">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 bg-surface overflow-hidden relative"
          style={{ borderRadius: "var(--border-radius)" }}
        >
          {thumbnail ? (
            <Image src={thumbnail} alt={productName} fill className="object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-surface" />
          )}
        </div>
      </Link>

      {/* Info + controls */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${productSlug}`}
            className="font-medium text-sm sm:text-base hover:underline line-clamp-2 leading-snug"
          >
            {productName}
          </Link>
          <button
            onClick={() => handleUpdate(0)}
            className="shrink-0 p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {variantEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variantEntries.map(([key, val]) => (
              <span
                key={key}
                className="px-2 py-0.5 text-[11px] rounded-full bg-surface border border-border-subtle text-text-secondary"
              >
                {key}: <span className="font-semibold">{val}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* Qty stepper */}
          <div
            className="flex items-center border border-border-subtle bg-bg shadow-[var(--shadow-xs)]"
            style={{ borderRadius: "var(--border-radius)" }}
          >
            <button
              onClick={() => handleUpdate(qty - 1)}
              className="px-2.5 py-1.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors rounded-l"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center border-x border-border-subtle">
              {qty}
            </span>
            <button
              onClick={() => handleUpdate(qty + 1)}
              className="px-2.5 py-1.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors rounded-r"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "var(--color-price)" }}>
              ৳{(priceAtAdd * qty).toLocaleString()}
            </p>
            {qty > 1 && (
              <p className="text-[11px] text-text-tertiary">
                ৳{priceAtAdd.toLocaleString()} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

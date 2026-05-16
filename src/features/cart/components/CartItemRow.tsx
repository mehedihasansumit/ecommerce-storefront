"use client";

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
  const { updateQuantity, removeItem, getLineByItem } = useCart();
  const qty = quantity;
  const line = getLineByItem({
    productId,
    productName,
    productSlug,
    thumbnail,
    variantSelections,
    quantity,
    priceAtAdd,
  });
  const unitPrice = line.unitPrice;
  const lineTotal = line.lineTotal;
  const hasTier = line.appliedTierQty !== null;

  function handleUpdate(newQty: number) {
    const next = Math.max(0, newQty);
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
            <Image
              src={thumbnail}
              alt={productName}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
            />
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
            className="font-medium text-sm sm:text-base text-[var(--color-text)] hover:underline line-clamp-2 leading-snug"
          >
            {productName}
          </Link>
          <button
            onClick={() => handleUpdate(0)}
            className="shrink-0 p-1.5 rounded-lg text-text-tertiary hover:text-red-500 hover:bg-red-50/80 transition-colors"
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
                className="px-2 py-0.5 text-[11px] rounded-full border border-border-subtle text-text-secondary"
                style={{ backgroundColor: "var(--color-card-bg)" }}
              >
                {key}: <span className="font-semibold">{val}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-auto">
          {/* Qty stepper */}
          <div
            className="flex items-center border border-border-subtle overflow-hidden"
            style={{
              borderRadius: "var(--border-radius)",
              backgroundColor: "var(--color-card-bg)",
            }}
          >
            <button
              onClick={() => handleUpdate(qty - 1)}
              className="px-2.5 py-1.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center border-x border-border-subtle text-[var(--color-text)]">
              {qty}
            </span>
            <button
              onClick={() => handleUpdate(qty + 1)}
              className="px-2.5 py-1.5 text-text-secondary hover:text-[var(--color-text)] hover:bg-surface transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Line total */}
          <div className="text-right">
            <p className="text-sm font-bold" style={{ color: "var(--color-price)" }}>
              ৳{lineTotal.toLocaleString()}
            </p>
            {qty > 1 && (
              <p className="text-[11px] text-text-tertiary">
                ৳{unitPrice.toFixed(2)} each
              </p>
            )}
            {hasTier && (
              <p
                className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                Bulk: {line.appliedTierQty} for ৳
                {line.appliedTierTotal?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

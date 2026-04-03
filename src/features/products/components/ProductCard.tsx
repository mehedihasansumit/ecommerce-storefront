"use client";

import Link from "next/link";
import type { IProduct } from "../types";
import { useTranslations } from "next-intl";

export function ProductCard({ product }: { product: IProduct }) {
  const t = useTranslations("productCard");
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden bg-white border border-gray-200 transition-shadow hover:shadow-lg"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.thumbnail || product.images[0]?.url ? (
          <img
            src={product.thumbnail || product.images[0].url}
            alt={product.images[0]?.alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {t("noImage")}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            ৳{product.price.toFixed(2)}
          </span>
          {product.compareAtPrice > 0 &&
            product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ৳{product.compareAtPrice.toFixed(2)}
              </span>
            )}
        </div>
        {product.averageRating > 0 && (
          <div className="mt-1 text-sm text-gray-500">
            {"★".repeat(Math.round(product.averageRating))}
            {"☆".repeat(5 - Math.round(product.averageRating))}
            <span className="ml-1">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}

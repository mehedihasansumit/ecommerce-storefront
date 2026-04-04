"use client";

import Link from "next/link";
import { Star, Eye } from "lucide-react";
import type { IProduct } from "../types";
import { useTranslations } from "next-intl";

export function ProductCard({ product }: { product: IProduct }) {
  const t = useTranslations("productCard");

  const hasDiscount =
    product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.thumbnail || product.images[0]?.url ? (
          <img
            src={product.thumbnail || product.images[0].url}
            alt={product.images[0]?.alt || product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Eye size={32} />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Discount badge */}
        {hasDiscount && (
          <span
            className="absolute top-3 left-3 px-2.5 py-1 text-xs font-bold text-white rounded-full shadow-md"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            -{discountPercent}%
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
              {t("outOfStock") || "Out of Stock"}
            </span>
          </div>
        )}

        {/* Quick view indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 90%, transparent)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <Eye size={14} />
            {t("viewDetails") || "View Details"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2 group-hover:text-gray-900 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.averageRating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i < Math.round(product.averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            ৳{product.price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ৳{product.compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { Star, Eye } from "lucide-react";
import type { IProduct } from "../types";
import { useTranslations, useLocale } from "next-intl";
import { t } from "@/shared/lib/i18n";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function ProductCard({ product }: { product: IProduct }) {
  const tr = useTranslations("productCard");
  const locale = useLocale();
  const productName = t(product.name, locale);

  const hasDiscount =
    product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
      style={{ borderRadius: "var(--border-radius)" }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.thumbnail || product.images[0]?.url ? (
          <img
            src={product.thumbnail || product.images[0].url}
            alt={product.images[0]?.alt || productName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Eye size={32} />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

        {/* Badges row - top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasDiscount && (
            <span
              className="px-2 py-0.5 text-[11px] font-bold text-white rounded-md leading-tight"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              -{discountPercent}%
            </span>
          )}
          {isNew && !hasDiscount && (
            <span className="px-2 py-0.5 text-[11px] font-bold text-white rounded-md leading-tight bg-emerald-500">
              New
            </span>
          )}
        </div>

        {/* Featured badge - top right */}
        {product.isFeatured && (
          <span
            className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md leading-tight"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
              color: "var(--color-primary)",
            }}
          >
            ★ Featured
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full">
              {tr("outOfStock") || "Out of Stock"}
            </span>
          </div>
        )}

        {/* Quick view indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <span
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm whitespace-nowrap"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 90%, transparent)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <Eye size={14} />
            {tr("viewDetails") || "View Details"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-sm text-gray-700 leading-snug line-clamp-2 mb-2 group-hover:text-gray-900 transition-colors">
          {productName}
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

        {/* Price + low stock */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span
              className="text-base font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              ৳{product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ৳{product.compareAtPrice.toLocaleString()}
              </span>
            )}
          </div>
          {isLowStock && (
            <span className="text-[10px] font-semibold text-orange-500 whitespace-nowrap">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

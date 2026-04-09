"use client";

import { Package } from "lucide-react";
import type { IProduct } from "../types";
import { ProductCard } from "./ProductCard";
import { useTranslations } from "next-intl";

export function ProductGrid({ products }: { products: IProduct[] }) {
  const t = useTranslations("products");
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <Package size={40} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg text-gray-500 font-medium">
          {t("noProducts")}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {t("noProductsHint") || "Try adjusting your search or filters"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 stagger-children">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

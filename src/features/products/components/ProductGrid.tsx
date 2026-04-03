"use client";

import type { IProduct } from "../types";
import { ProductCard } from "./ProductCard";
import { useTranslations } from "next-intl";

export function ProductGrid({ products }: { products: IProduct[] }) {
  const t = useTranslations("products");
  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">{t("noProducts")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}

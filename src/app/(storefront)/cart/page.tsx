"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { useTranslations } from "next-intl";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, subtotal } = useCart();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">{t("yourCart")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <ShoppingBag size={48} className="text-gray-300" />
          <p className="text-lg text-gray-500">{t("empty")}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 text-white font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 px-4 sm:px-6">
              {items.map((item, idx) => (
                <CartItemRow
                  key={`${item.productId}-${JSON.stringify(item.variantSelections)}-${idx}`}
                  productId={item.productId}
                  productName={item.productName}
                  productSlug={item.productSlug}
                  thumbnail={item.thumbnail}
                  priceAtAdd={item.priceAtAdd}
                  quantity={item.quantity}
                  variantSelections={item.variantSelections}
                />
              ))}
            </div>

            <Link
              href="/products"
              className="inline-block mt-4 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              {t("continueShopping")} ←
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-4">
              <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {t("subtotal")} ( {items.length}{" "}
                    {t("items", { count: items.length })} )
                  </span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-base">
                <span>{t("total")}</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-5 block w-full text-center py-3.5 text-white font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                {t("checkout")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

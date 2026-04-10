"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, X, Tag } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { useTranslations } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";

export default function CartPage() {
  const t = useTranslations("cart");
  const {
    items,
    subtotal,
    coupon,
    discount,
    total,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const tenant = useTenant();

  useEffect(() => {
    document.title = `Cart | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-10">{t("yourCart")}</h1>

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
            <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] px-4 sm:px-6">
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
              ← {t("continueShopping")}
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] p-7 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

              {/* Coupon input */}
              <CouponInput
                coupon={coupon}
                couponLoading={couponLoading}
                couponError={couponError}
                onApply={applyCoupon}
                onRemove={removeCoupon}
              />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {t("subtotal")} ( {items.length}{" "}
                    {t("items", { count: items.length })} )
                  </span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-bold text-base">
                <span>{t("total")}</span>
                <span>৳{total.toLocaleString()}</span>
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

function CouponInput({
  coupon,
  couponLoading,
  couponError,
  onApply,
  onRemove,
}: {
  coupon: { code: string; discount: number } | null;
  couponLoading: boolean;
  couponError: string;
  onApply: (code: string) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const success = await onApply(code.trim());
    if (success) setCode("");
  }

  if (coupon) {
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm">
        <Tag size={14} className="text-green-600 shrink-0" />
        <span className="text-green-700 font-medium flex-1">
          {coupon.code} (-৳{coupon.discount.toLocaleString()})
        </span>
        <button
          onClick={onRemove}
          className="text-green-600 hover:text-green-800 p-0.5"
          aria-label="Remove coupon"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Coupon code"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        <button
          type="submit"
          disabled={couponLoading || !code.trim()}
          className="px-4 py-2 text-sm font-medium border rounded-lg transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
        >
          {couponLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
        </button>
      </form>
      {couponError && (
        <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
      )}
    </div>
  );
}

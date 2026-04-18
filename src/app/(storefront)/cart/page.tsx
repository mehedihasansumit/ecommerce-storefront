"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, X, Tag, ArrowRight, Truck } from "lucide-react";
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

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center">
            <ShoppingBag size={36} className="text-text-tertiary" />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-1">{t("empty")}</h1>
            <p className="text-text-secondary text-sm">{t("emptyDesc") || "Add some items to get started."}</p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            {t("continueShopping")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("yourCart")}
          <span className="ml-2 text-base font-normal text-text-secondary">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </h1>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
        >
          ← {t("continueShopping")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Items list */}
        <div className="lg:col-span-2">
          <div
            className="bg-bg border border-border-subtle shadow-[var(--shadow-sm)] overflow-hidden"
            style={{ borderRadius: "calc(var(--border-radius) * 1.5)" }}
          >
            <div className="px-5 sm:px-6">
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
          </div>

          {/* Free shipping nudge */}
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border-subtle text-sm text-text-secondary">
            <Truck size={15} className="shrink-0" style={{ color: "var(--color-primary)" }} />
            <span>{t("freeShippingNote") || "Free shipping on this order"}</span>
          </div>

          <Link
            href="/products"
            className="inline-flex sm:hidden items-center gap-1.5 mt-4 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
          >
            ← {t("continueShopping")}
          </Link>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div
            className="bg-bg border border-border-subtle shadow-[var(--shadow-sm)] p-5 sticky top-24"
            style={{ borderRadius: "calc(var(--border-radius) * 1.5)" }}
          >
            <h2 className="font-bold text-base mb-5">{t("orderSummary")}</h2>

            {/* Coupon */}
            <CouponInput
              coupon={coupon}
              couponLoading={couponLoading}
              couponError={couponError}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />

            {/* Line items */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 text-text-secondary">
                <span>{t("subtotal")} ({items.length} {items.length === 1 ? "item" : "items"})</span>
                <span className="font-medium shrink-0">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-3 text-green-600 dark:text-green-400">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    Coupon ({coupon?.code})
                  </span>
                  <span className="font-medium shrink-0">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-text-secondary">
                <span>{t("shipping")}</span>
                <span className="shrink-0 font-medium text-green-600 dark:text-green-400">Free</span>
              </div>
            </div>

            {/* Total */}
            <div
              className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3"
            >
              <span className="font-bold text-base">{t("total")}</span>
              <span
                className="font-extrabold text-xl shrink-0"
                style={{ color: "var(--color-price)" }}
              >
                ৳{total.toLocaleString()}
              </span>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {t("checkout")}
              <ArrowRight size={16} />
            </Link>

            <p className="mt-3 text-[11px] text-text-tertiary text-center">
              {t("secureCheckout") || "Secure checkout · SSL encrypted"}
            </p>
          </div>
        </div>
      </div>
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
      <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-sm">
        <Tag size={13} className="text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-green-700 dark:text-green-300 font-medium flex-1 truncate">
          {coupon.code} · -৳{coupon.discount.toLocaleString()}
        </span>
        <button
          onClick={onRemove}
          className="shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 p-0.5 rounded transition-colors"
          aria-label="Remove coupon"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <form onSubmit={handleApply} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="flex-1 min-w-0 px-3 py-2 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-bg text-[var(--color-text)] placeholder:text-text-tertiary"
          style={{ ["--tw-ring-color" as string]: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
        />
        <button
          type="submit"
          disabled={couponLoading || !code.trim()}
          className="shrink-0 px-4 py-2 text-sm font-semibold border rounded-lg transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          style={{
            borderColor: "var(--color-primary)",
            color: "var(--color-primary)",
          }}
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

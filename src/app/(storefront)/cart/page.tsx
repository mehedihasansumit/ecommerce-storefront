"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Loader2, X, Tag, ArrowRight, ArrowLeft, Truck, Lock } from "lucide-react";
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
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}
          >
            <ShoppingBag size={36} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold mb-1 text-[var(--color-text)]">{t("empty")}</h1>
            <p className="text-text-secondary text-sm">{t("emptyDesc")}</p>
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {t("yourCart")}
          <span className="ml-2 text-base font-normal text-text-tertiary">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </h1>
        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={15} />
          {t("continueShopping")}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-3">
          <div
            className="border border-border-subtle shadow-sm overflow-hidden"
            style={{
              backgroundColor: "var(--color-card-bg)",
              borderRadius: "calc(var(--border-radius) * 1.5)",
            }}
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
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border-subtle text-sm text-text-secondary"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, transparent)" }}
          >
            <Truck size={15} className="shrink-0" style={{ color: "var(--color-primary)" }} />
            <span>{t("freeShippingNote")}</span>
          </div>

          <Link
            href="/products"
            className="inline-flex sm:hidden items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft size={15} />
            {t("continueShopping")}
          </Link>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div
            className="border border-border-subtle shadow-sm p-5 sticky top-24"
            style={{
              backgroundColor: "var(--color-card-bg)",
              borderRadius: "calc(var(--border-radius) * 1.5)",
            }}
          >
            <h2 className="font-bold text-base mb-5 text-[var(--color-text)]">{t("orderSummary")}</h2>

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
                <span>
                  {t("subtotal")} ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
                <span className="font-medium shrink-0 text-[var(--color-text)]">৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-3" style={{ color: "#16a34a" }}>
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    Coupon ({coupon?.code})
                  </span>
                  <span className="font-medium shrink-0">-৳{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-text-secondary">
                <span>{t("shipping")}</span>
                <span className="shrink-0 font-semibold" style={{ color: "#16a34a" }}>Free</span>
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
              <span className="font-bold text-base text-[var(--color-text)]">{t("total")}</span>
              <span className="font-extrabold text-xl shrink-0" style={{ color: "var(--color-price)" }}>
                ৳{total.toLocaleString()}
              </span>
            </div>

            {/* Checkout CTA */}
            <Link
              href="/checkout"
              className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {t("checkout")}
              <ArrowRight size={16} />
            </Link>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-text-tertiary">
              <Lock size={10} />
              <span>{t("secureCheckout")}</span>
            </div>
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
      <div
        className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border"
        style={{
          backgroundColor: "color-mix(in srgb, #16a34a 8%, transparent)",
          borderColor: "color-mix(in srgb, #16a34a 25%, transparent)",
        }}
      >
        <Tag size={13} style={{ color: "#16a34a" }} className="shrink-0" />
        <span className="font-medium flex-1 truncate" style={{ color: "#16a34a" }}>
          {coupon.code} · -৳{coupon.discount.toLocaleString()}
        </span>
        <button
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded transition-opacity hover:opacity-60"
          style={{ color: "#16a34a" }}
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
          className="flex-1 min-w-0 px-3 py-2 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all placeholder:text-text-tertiary text-[var(--color-text)]"
          style={{
            backgroundColor: "var(--color-card-bg)",
            ["--tw-ring-color" as string]: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
          }}
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

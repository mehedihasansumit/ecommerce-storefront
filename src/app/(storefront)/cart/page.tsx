"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, X, Tag, ArrowRight, ArrowLeft, Truck, Gift, Sparkles } from "lucide-react";
import { useCart } from "@/shared/context/CartContext";
import { CartItemRow } from "@/features/cart/components/CartItemRow";
import { CartSkeleton } from "@/features/cart/components/CartSkeleton";
import { useTranslations, useLocale } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";
import { t as tLocalized } from "@/shared/lib/i18n";
import { Button, ButtonLink, Input, formatPrice } from "@/shared/components/ui";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import { DELIVERY_CURRENCY } from "@/shared/lib/delivery";

export default function CartPage() {
  const t = useTranslations("cart");
  const {
    items,
    subtotal,
    coupon,
    couponDiscount,
    appliedCampaigns,
    campaignFreeItems,
    campaignFreeShipping,
    campaignSuggestions,
    total,
    couponLoading,
    couponError,
    applyCoupon,
    removeCoupon,
    hydrated,
  } = useCart();
  const tenant = useTenant();
  const locale = useLocale();
  const currency = useStoreCurrency();
  const tt = useTranslations("trust");
  const money = (n: number) => formatPrice(n, currency, locale);
  // Real delivery terms from the store config. Without a configured fee the
  // checkout charges nothing, so "free" is only claimed when it is true.
  const deliveryFact = tenant
    ? getStoreTrustFacts(tenant).find((f) => f.kind === "delivery")
    : undefined;
  const deliveryDue = Boolean(deliveryFact) && !campaignFreeShipping;

  useEffect(() => {
    document.title = `Cart | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);

  // Cart lives in localStorage: until it's read, show a skeleton instead of
  // flashing the empty state at shoppers who do have items.
  if (!hydrated) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}
          >
            <ShoppingBag size={36} aria-hidden style={{ color: "var(--color-link)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-medium mb-1 text-[var(--color-text)]">{t("empty")}</h1>
            <p className="text-text-secondary text-sm">{t("emptyDesc")}</p>
          </div>
          <ButtonLink
            href="/products"
            variant="brand"
            size="lg"
            rightIcon={<ArrowRight size={16} aria-hidden />}
          >
            {t("continueShopping")}
          </ButtonLink>
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
            ({t("items", { count: items.length })})
          </span>
        </h1>
        <Link
          href="/products"
          className="focus-ring hidden sm:inline-flex min-h-10 items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
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
                  productName={item.productNames ? tLocalized(item.productNames, locale) || item.productName : item.productName}
                  productSlug={item.productSlug}
                  thumbnail={item.thumbnail}
                  priceAtAdd={item.priceAtAdd}
                  quantity={item.quantity}
                  variantSelections={item.variantSelections}
                />
              ))}
            </div>
          </div>

          {/* Delivery note: the store's real fee, or free shipping when it really is free */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border-subtle text-sm text-text-secondary"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, transparent)" }}
          >
            <Truck size={15} aria-hidden className="shrink-0" style={{ color: "var(--color-link)" }} />
            <span>
              {deliveryDue && deliveryFact?.kind === "delivery"
                ? tt("deliveryLong", {
                    inside: formatPrice(deliveryFact.insideDhaka, DELIVERY_CURRENCY, locale),
                    outside: formatPrice(deliveryFact.outsideDhaka, DELIVERY_CURRENCY, locale),
                  })
                : t("freeShippingNote")}
            </span>
          </div>

          <Link
            href="/products"
            className="focus-ring inline-flex sm:hidden min-h-10 items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
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
                  {t("subtotal")} ({t("items", { count: items.length })})
                </span>
                <span className="font-medium shrink-0 text-[var(--color-text)]">{money(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex items-center justify-between gap-3" style={{ color: "var(--color-success)" }}>
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} />
                    {t("couponLine", { code: coupon?.code ?? "" })}
                  </span>
                  <span className="font-medium shrink-0">-{money(couponDiscount)}</span>
                </div>
              )}
              {appliedCampaigns.map((c) => (
                <div
                  key={c.campaignId}
                  className="flex items-start justify-between gap-3"
                  style={{ color: "var(--color-success)" }}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} />
                    {tLocalized(c.campaignName, locale)}
                  </span>
                  {c.discountAmount > 0 && (
                    <span className="font-medium shrink-0">
                      -{money(c.discountAmount)}
                    </span>
                  )}
                </div>
              ))}
              {campaignFreeItems.length > 0 && (
                <div className="rounded-lg border border-border-subtle p-2.5 space-y-1.5">
                  {campaignFreeItems.map((f, i) => (
                    <div
                      key={`${f.productId}-${i}`}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <Gift size={12} style={{ color: "var(--color-primary)" }} />
                        {t("freeItemQty", { qty: f.qty })}
                      </span>
                      <span style={{ color: "var(--color-success)" }} className="font-medium">
                        {t("free")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {campaignSuggestions.length > 0 && (
                <div
                  className="rounded-lg p-2.5 text-xs space-y-1"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                    color: "var(--color-text)",
                  }}
                >
                  {campaignSuggestions.map((s) => (
                    <div key={s.campaignId} className="flex items-start gap-1.5">
                      <Sparkles size={12} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                      <span>{s.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-3 text-text-secondary">
                <span>{t("shipping")}</span>
                {deliveryDue ? (
                  <span className="shrink-0 text-right">{t("shippingAtCheckout")}</span>
                ) : (
                  <span className="shrink-0 font-semibold" style={{ color: "var(--color-success)" }}>
                    {campaignFreeShipping ? t("freeCampaign") : t("free")}
                  </span>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
              <span className="font-bold text-base text-[var(--color-text)]">{t("total")}</span>
              <span className="font-extrabold text-xl shrink-0" style={{ color: "var(--color-price)" }}>
                {money(total)}
              </span>
            </div>

            {/* Checkout CTA */}
            <ButtonLink
              href="/checkout"
              variant="brand"
              size="xl"
              fullWidth
              className="mt-5"
              rightIcon={<ArrowRight size={16} aria-hidden />}
            >
              {t("checkout")}
            </ButtonLink>
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
  const tc = useTranslations("cart");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const removeLabel = tc("removeCoupon");

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
          backgroundColor: "color-mix(in srgb, var(--color-success) 8%, transparent)",
          borderColor: "color-mix(in srgb, var(--color-success) 25%, transparent)",
        }}
      >
        <Tag size={13} style={{ color: "var(--color-success)" }} className="shrink-0" />
        <span className="font-medium flex-1 truncate" style={{ color: "var(--color-success)" }}>
          {coupon.code} · -{formatPrice(coupon.discount, currency, locale)}
        </span>
        <button
          onClick={onRemove}
          type="button"
          className="focus-ring shrink-0 -my-2 -mr-2 inline-flex h-10 w-10 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ color: "var(--color-success)" }}
          aria-label={removeLabel}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <form onSubmit={handleApply} className="flex gap-2">
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={tc("couponPlaceholder")}
          aria-label={tc("couponPlaceholder")}
          invalid={Boolean(couponError)}
          aria-describedby={couponError ? "coupon-error" : undefined}
          autoCapitalize="characters"
          className="flex-1 min-w-0"
        />
        <Button
          type="submit"
          variant="secondary"
          loading={couponLoading}
          disabled={!code.trim()}
          className="shrink-0 min-h-10"
        >
          {tc("applyCoupon")}
        </Button>
      </form>
      {couponError && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-xs text-error">{couponError}</p>
      )}
    </div>
  );
}

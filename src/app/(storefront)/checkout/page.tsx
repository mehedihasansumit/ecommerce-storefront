"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import { CheckoutSkeleton } from "@/features/cart/components/CheckoutSkeleton";
import {
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Tag,
  Lock,
  Truck,
  Gift,
  Sparkles,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { t as tLocalized } from "@/shared/lib/i18n";
import { AddressSelector } from "@/features/auth/components/AddressSelector";
import type { IAddress } from "@/features/auth/types";
import { useTenant } from "@/shared/hooks/useTenant";
import { Alert, Button, Input, LocationSelect, Select, formatPrice } from "@/shared/components/ui";
import { calcDeliveryCharge, isInsideDhaka } from "@/shared/lib/delivery";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";
import { useOptionLabels } from "@/shared/hooks/useOptionLabels";
import { formatNumber } from "@/shared/lib/i18n";

interface FormData {
  name: string;
  phone: string;
  email: string;
  street: string;
  division: string;
  district: string;
  upazila: string;
  union: string;
  postalCode: string;
  country: string;
  notes: string;
}

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  street: "",
  division: "",
  district: "",
  upazila: "",
  union: "",
  postalCode: "",
  country: "Bangladesh",
  notes: "",
};

// Same metrics and focus treatment as the <Input>/<Select> primitives, so the text
// fields and the location selects line up (they were 44px vs 40px).
const inputBase =
  "w-full min-h-10 px-3 py-2 border rounded-lg text-sm bg-[var(--color-card-bg)] text-[var(--color-text)] transition-colors placeholder:text-text-tertiary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-ring,var(--color-primary))]";
const inputNormal = `${inputBase} border-input-border hover:border-text-secondary`;
const inputError = `${inputBase} border-error`;
const inputReadOnly = `${inputBase} border-border-subtle bg-surface text-text-secondary cursor-default`;

const subscribeNoop = () => () => {};

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const router = useRouter();
  const {
    items,
    subtotal,
    coupon,
    couponDiscount,
    appliedCampaigns,
    campaignFreeItems,
    campaignFreeShipping,
    total,
    clearCart,
    hydrated: cartHydrated,
  } = useCart();
  const tenant = useTenant();
  const locale = useLocale();
  const optionLabel = useOptionLabels();
  const currency = useStoreCurrency();
  const money = (n: number) => formatPrice(n, currency, locale);

  useEffect(() => {
    document.title = `Checkout | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  // true on the client, false during SSR — gates the localStorage-backed cart.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<IAddress[]>([]);
  const [usingSavedAddress, setUsingSavedAddress] = useState(false);

  const loadSavedAddresses = useCallback(async () => {
    try {
      const authRes = await fetch("/api/auth/customer");
      const authData = await authRes.json();
      if (!authData.user) return;

      setIsLoggedIn(true);
      const addrRes = await fetch("/api/addresses");
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        if (addrData.addresses?.length > 0) {
          setSavedAddresses(addrData.addresses);
          const defaultAddr =
            addrData.addresses.find((a: IAddress) => a.isDefault) ||
            addrData.addresses[0];
          setUsingSavedAddress(true);
          setForm((f) => ({
            ...f,
            street: defaultAddr.street,
            division: defaultAddr.division || "",
            district: defaultAddr.district || "",
            upazila: defaultAddr.upazila || "",
            union: defaultAddr.union || "",
            postalCode: defaultAddr.postalCode || "",
            country: defaultAddr.country || "Bangladesh",
          }));
        }
      }
    } catch {
      // guest checkout
    }
  }, []);

  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    // Deferred a tick: the loader sets state, which must not run synchronously in the effect.
    const id = setTimeout(() => void loadSavedAddresses(), 0);
    return () => clearTimeout(id);
  }, [loadSavedAddresses]);
  useEffect(() => {
    // Wait for the cart to load from localStorage, else an empty first render bounces to /cart.
    if (cartHydrated && !orderPlaced && items.length === 0) router.replace("/cart");
  }, [cartHydrated, orderPlaced, items.length, router]);

  function handleAddressSelect(address: IAddress | null) {
    if (address) {
      setUsingSavedAddress(true);
      setForm((f) => ({
        ...f,
        street: address.street,
        division: address.division || "",
        district: address.district || "",
        upazila: address.upazila || "",
        union: address.union || "",
        postalCode: address.postalCode || "",
        country: address.country || "Bangladesh",
      }));
    } else {
      setUsingSavedAddress(false);
      setForm((f) => ({
        ...f,
        street: "",
        division: "",
        district: "",
        upazila: "",
        union: "",
        postalCode: "",
        country: "Bangladesh",
      }));
    }
  }

  async function handleSaveNewAddress(data: Omit<IAddress, "_id">) {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setSavedAddresses(result.addresses);
    const newAddr = result.addresses[result.addresses.length - 1];
    setUsingSavedAddress(true);
    setForm((f) => ({
      ...f,
      street: newAddr.street,
      division: newAddr.division || "",
      district: newAddr.district || "",
      upazila: newAddr.upazila || "",
      union: newAddr.union || "",
      postalCode: newAddr.postalCode || "",
      country: newAddr.country || "Bangladesh",
    }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = t("nameRequired");
    const phone = form.phone.trim().replace(/\s/g, "");
    if (!phone) {
      e.phone = t("phoneRequired");
    } else if (!/^[0-9]{11}$/.test(phone)) {
      e.phone = t("phoneInvalid");
    }
    if (!form.street.trim()) e.street = t("addressRequired");
    if (!form.division.trim()) e.division = t("divisionRequired");
    if (!form.district.trim()) e.district = t("districtRequired");
    if (!form.upazila.trim()) e.upazila = t("upazilaRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestEmail: form.email || undefined,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            variantSelections: i.variantSelections,
          })),
          shippingAddress: {
            name: form.name,
            phone: `+88${form.phone.trim()}`,
            street: form.street,
            division: form.division,
            district: form.district,
            upazila: form.upazila,
            union: form.union,
            city: form.district, // backward-compat: city = district
            postalCode: form.postalCode,
            country: form.country,
            state: form.division,
          },
          paymentMethod: "cod",
          notes: form.notes,
          couponCode: coupon?.code || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || t("error"));
        return;
      }

      setOrderPlaced(true);
      clearCart();
      router.push(`/orders/${data.orderId}?confirmed=1`);
    } catch {
      setServerError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  const deliveryEnabled = !!tenant?.deliveryConfig?.enabled;
  // Charge is district-driven; don't apply a fee until the customer picks one
  // (an empty district would otherwise resolve to the outside-Dhaka rate).
  const shippingCost = form.district
    ? calcDeliveryCharge(tenant?.deliveryConfig, form.district, campaignFreeShipping)
    : 0;
  const shippingPending = deliveryEnabled && !campaignFreeShipping && !form.district;
  const deliveryZoneLabel =
    deliveryEnabled && form.district && !campaignFreeShipping
      ? isInsideDhaka(form.district)
        ? t("insideDhaka")
        : t("outsideDhaka")
      : "";
  const grandTotal = total + shippingCost;

  if (!mounted || !cartHydrated) return <CheckoutSkeleton />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="focus-ring inline-flex min-h-10 items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors mb-2"
        >
          <ArrowLeft size={15} aria-hidden /> {t("backToCart")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("checkout")}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

          {/* ── Left column ── */}
          <div className="space-y-4">

            {/* Step 1 — Saved addresses */}
            {isLoggedIn && savedAddresses.length > 0 && (
              <Section icon={<MapPin size={16} />} step="1" title={t("deliveryAddress") || "Delivery Address"}>
                <AddressSelector
                  addresses={savedAddresses}
                  onSelect={handleAddressSelect}
                  onSaveNew={handleSaveNewAddress}
                />
              </Section>
            )}

            {/* Step 2 — Delivery info */}
            <Section
              icon={<MapPin size={16} />}
              step={isLoggedIn && savedAddresses.length > 0 ? "2" : "1"}
              title={t("deliveryInfo")}
            >
              <div className="space-y-4">
                {/* Name + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrap label={t("fullName")} required error={errors.name}>
                    <input
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t("fullName")}
                      className={errors.name ? inputError : inputNormal}
                    />
                  </FieldWrap>

                  <FieldWrap label={t("phoneNumber")} required error={errors.phone}>
                    <Input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      prefix="+88"
                      invalid={Boolean(errors.phone)}
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder={tc("phonePlaceholder")}
                      maxLength={11}
                    />
                  </FieldWrap>
                </div>

                {/* Email */}
                <FieldWrap label={t("emailAddress")} optional={t("optional")}>
                  <input
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={inputNormal}
                  />
                </FieldWrap>

                {/* Location: Division → District → Upazila → Union */}
                <LocationSelect
                  value={{
                    division: form.division,
                    district: form.district,
                    upazila: form.upazila,
                    union: form.union,
                  }}
                  onChange={(v) => setForm((f) => ({ ...f, ...v }))}
                  locale={locale}
                  disabled={usingSavedAddress}
                  required={{ division: true, district: true, upazila: true }}
                  errors={{
                    division: errors.division,
                    district: errors.district,
                    upazila: errors.upazila,
                  }}
                  labels={{
                    division: t("division"),
                    district: t("district"),
                    upazila: t("upazila"),
                    union: t("union"),
                  }}
                  placeholders={{
                    division: t("selectDivision"),
                    district: t("selectDistrict"),
                    upazila: t("selectUpazila"),
                    union: t("selectUnion"),
                  }}
                />

                {/* Postal */}
                <FieldWrap label={t("postalCode")}>
                  <input
                    type="text"
                    autoComplete="postal-code"
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    readOnly={usingSavedAddress}
                    placeholder={t("postalCode")}
                    className={usingSavedAddress ? inputReadOnly : inputNormal}
                  />
                </FieldWrap>

                {/* Street — exact house/road, after the area is chosen */}
                <FieldWrap label={t("streetAddress")} required error={errors.street}>
                  <input
                    type="text"
                    autoComplete="street-address"
                    value={form.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                    readOnly={usingSavedAddress}
                    placeholder={t("streetAddress")}
                    className={usingSavedAddress ? inputReadOnly : errors.street ? inputError : inputNormal}
                  />
                </FieldWrap>

                {/* Country */}
                <FieldWrap label={t("country")}>
                  <Select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    disabled={usingSavedAddress}
                  >
                    <option>Bangladesh</option>
                    <option>India</option>
                    <option>Pakistan</option>
                    <option>Other</option>
                  </Select>
                </FieldWrap>

                {/* Notes — collapsible */}
                <div>
                  <button
                    type="button"
                    onClick={() => setNotesOpen((o) => !o)}
                    aria-expanded={notesOpen}
                    className="focus-ring flex min-h-10 items-center gap-2 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
                  >
                    <ChevronDown
                      size={15}
                      className={`transition-transform duration-200 ${notesOpen ? "rotate-180" : ""}`}
                    />
                    {t("orderNotes")}
                    <span className="text-text-tertiary font-normal">({t("optional")})</span>
                  </button>
                  {notesOpen && (
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder={t("orderNotes")}
                      rows={3}
                      className={`${inputNormal} mt-2 resize-none`}
                    />
                  )}
                </div>
              </div>
            </Section>

            {/* Step 3 — Payment */}
            <Section
              icon={<CreditCard size={16} />}
              step={isLoggedIn && savedAddresses.length > 0 ? "3" : "2"}
              title={t("paymentMethod")}
            >
              <label
                className="flex items-center gap-3 cursor-pointer px-4 py-3.5 rounded-xl border-2 transition-all"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
                  borderColor: "var(--color-primary)",
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  defaultChecked
                  readOnly
                  className="w-4 h-4"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t("cashOnDelivery")}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{t("payWhenReceive")}</p>
                </div>
                <CheckCircle2 size={18} style={{ color: "var(--color-primary)" }} />
              </label>
            </Section>
          </div>

          {/* ── Right column — Order summary ── */}
          <div className="sticky top-24">
            <div
              className="bg-bg border border-border-subtle shadow-[var(--shadow-sm)] overflow-hidden"
              style={{ borderRadius: "calc(var(--border-radius) * 1.5)" }}
            >
              {/* Summary header */}
              <div className="px-5 pt-5 pb-4 border-b border-border-subtle">
                <h2 className="font-bold text-base">{t("orderSummary")}</h2>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <Link
                    key={`${item.productId}-${idx}`}
                    href={item.productSlug ? `/products/${item.productSlug}` : "#"}
                    className="group flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-surface"
                  >
                    <div
                      className="w-12 h-12 bg-surface overflow-hidden relative shrink-0"
                      style={{ borderRadius: "var(--border-radius)" }}
                    >
                      {item.thumbnail ? (
                        <Image src={item.thumbnail} alt={item.productName} fill className="media-dim object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <ShoppingBag size={16} className="m-auto mt-3 text-text-tertiary" />
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-[10px] font-bold flex items-center justify-center">
                          {formatNumber(item.quantity, locale)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-snug transition-colors group-hover:text-[var(--color-primary)]">{item.productNames ? tLocalized(item.productNames, locale) || item.productName : item.productName}</p>
                      {Object.keys(item.variantSelections || {}).length > 0 && (
                        <p className="text-[11px] text-text-tertiary truncate">
                          {Object.entries(item.variantSelections).map(([k, v]) => `${optionLabel.name(k)}: ${optionLabel.value(v)}`).join(" · ")}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary">{t("qtyShort", { qty: item.quantity })}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <p className="text-xs font-semibold" style={{ color: "var(--color-price)" }}>
                        {money(item.priceAtAdd * item.quantity)}
                      </p>
                      <ChevronRight size={14} className="text-text-tertiary opacity-0 -ml-0.5 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 pb-5 pt-3 border-t border-border-subtle space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span>{t("subtotal")}</span>
                  <span className="shrink-0 font-medium">{money(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between gap-3 text-success">
                    <span className="flex items-center gap-1.5 truncate">
                      <Tag size={12} /> {coupon?.code}
                    </span>
                    <span className="shrink-0 font-medium">-{money(couponDiscount)}</span>
                  </div>
                )}
                {appliedCampaigns.map((c) => (
                  <div
                    key={c.campaignId}
                    className="flex items-center justify-between gap-3 text-success"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Sparkles size={12} /> {tLocalized(c.campaignName, locale)}
                    </span>
                    {c.discountAmount > 0 && (
                      <span className="shrink-0 font-medium">
                        -{money(c.discountAmount)}
                      </span>
                    )}
                  </div>
                ))}
                {campaignFreeItems.map((f, i) => (
                  <div
                    key={`${f.productId}-${i}`}
                    className="flex items-center justify-between gap-3 text-text-secondary"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Gift size={12} aria-hidden style={{ color: "var(--color-link)" }} /> {t("freeGiftQty", { qty: f.qty })}
                    </span>
                    <span className="shrink-0 font-medium text-success">
                      {t("shippingFree")}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Truck size={13} />
                    {t("shipping")}
                    {deliveryZoneLabel && (
                      <span className="text-[11px] text-text-tertiary font-normal">
                        · {deliveryZoneLabel}
                      </span>
                    )}
                  </span>
                  {shippingPending ? (
                    <span className="shrink-0 text-xs text-text-tertiary text-right">
                      {t("shippingSelectArea")}
                    </span>
                  ) : shippingCost > 0 ? (
                    <span className="shrink-0 font-medium">{money(shippingCost)}</span>
                  ) : (
                    <span className="shrink-0 font-medium text-success">
                      {campaignFreeShipping ? t("shippingFreeCampaign") : t("shippingFree")}
                    </span>
                  )}
                </div>

                <div className="pt-3 mt-1 border-t border-border-subtle flex items-center justify-between gap-3">
                  <span className="font-bold">{t("total")}</span>
                  <span
                    className="font-extrabold text-xl shrink-0"
                    style={{ color: "var(--color-price)" }}
                  >
                    {money(grandTotal)}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                {serverError && (
                  <Alert tone="error" className="mb-3">
                    {serverError}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="brand"
                  size="xl"
                  fullWidth
                  loading={submitting}
                  leftIcon={<Lock size={15} aria-hidden />}
                >
                  {submitting ? t("placingOrder") : t("placeOrder")}
                </Button>

                <p className="mt-2.5 text-xs text-text-tertiary text-center">
                  {t("secureCheckout")}
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({
  icon,
  step,
  title,
  children,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-bg border border-border-subtle shadow-[var(--shadow-xs)] overflow-hidden"
      style={{ borderRadius: "calc(var(--border-radius) * 1.5)" }}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {step}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {icon}
          {title}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── Field wrapper ── */
function FieldWrap({
  label,
  required,
  optional,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
        {optional && <span className="ml-1 text-text-tertiary font-normal">({optional})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

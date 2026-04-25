"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import {
  ShoppingBag,
  Loader2,
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Tag,
  Lock,
  Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AddressSelector } from "@/features/auth/components/AddressSelector";
import type { IAddress } from "@/features/auth/types";
import { useTenant } from "@/shared/hooks/useTenant";

interface FormData {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  postalCode: "",
  country: "Bangladesh",
  notes: "",
};

const inputBase =
  "w-full px-3.5 py-2.5 border rounded-lg text-sm bg-bg text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all placeholder:text-text-tertiary";
const inputNormal = `${inputBase} border-border-subtle focus:border-[var(--color-primary)] focus:ring-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]`;
const inputError = `${inputBase} border-red-400 focus:ring-red-200`;
const inputReadOnly = `${inputBase} border-border-subtle bg-surface text-text-secondary cursor-default`;

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, subtotal, coupon, discount, total, clearCart } = useCart();
  const tenant = useTenant();

  useEffect(() => {
    document.title = `Checkout | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);

  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<IAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
          setSelectedAddressId(defaultAddr._id);
          setUsingSavedAddress(true);
          setForm((f) => ({
            ...f,
            street: defaultAddr.street,
            city: defaultAddr.city,
            postalCode: defaultAddr.postalCode || "",
            country: defaultAddr.country || "Bangladesh",
          }));
        }
      }
    } catch {
      // guest checkout
    }
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted) loadSavedAddresses(); }, [mounted, loadSavedAddresses]);
  useEffect(() => {
    if (mounted && items.length === 0) router.replace("/cart");
  }, [mounted, items.length, router]);

  function handleAddressSelect(address: IAddress | null) {
    if (address) {
      setSelectedAddressId(address._id);
      setUsingSavedAddress(true);
      setForm((f) => ({
        ...f,
        street: address.street,
        city: address.city,
        postalCode: address.postalCode || "",
        country: address.country || "Bangladesh",
      }));
    } else {
      setSelectedAddressId(null);
      setUsingSavedAddress(false);
      setForm((f) => ({ ...f, street: "", city: "", postalCode: "", country: "Bangladesh" }));
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
    setSelectedAddressId(newAddr._id);
    setUsingSavedAddress(true);
    setForm((f) => ({
      ...f,
      street: newAddr.street,
      city: newAddr.city,
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
    if (!form.city.trim()) e.city = t("cityRequired");
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
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
            state: "",
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

      clearCart();
      router.push(`/orders/${data.orderId}?confirmed=1`);
    } catch {
      setServerError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors mb-4"
        >
          ← {t("backToCart")}
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
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t("fullName")}
                      className={errors.name ? inputError : inputNormal}
                    />
                  </FieldWrap>

                  <FieldWrap label={t("phoneNumber")} required error={errors.phone}>
                    <div className={`flex items-center border rounded-lg overflow-hidden transition-colors ${errors.phone ? "border-red-400" : "border-border-subtle focus-within:border-[var(--color-primary)]"}`}>
                      <span className="px-3 py-2.5 text-sm font-medium text-text-secondary bg-surface border-r border-border-subtle shrink-0 select-none">
                        +88
                      </span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        maxLength={11}
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent text-[var(--color-text)]"
                      />
                    </div>
                  </FieldWrap>
                </div>

                {/* Email */}
                <FieldWrap label={t("emailAddress")} optional={t("optional")}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className={inputNormal}
                  />
                </FieldWrap>

                {/* Street */}
                <FieldWrap label={t("streetAddress")} required error={errors.street}>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                    readOnly={usingSavedAddress}
                    placeholder={t("streetAddress")}
                    className={usingSavedAddress ? inputReadOnly : errors.street ? inputError : inputNormal}
                  />
                </FieldWrap>

                {/* City + Postal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrap label={t("city")} required error={errors.city}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      readOnly={usingSavedAddress}
                      placeholder={t("city")}
                      className={usingSavedAddress ? inputReadOnly : errors.city ? inputError : inputNormal}
                    />
                  </FieldWrap>
                  <FieldWrap label={t("postalCode")}>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                      readOnly={usingSavedAddress}
                      placeholder={t("postalCode")}
                      className={usingSavedAddress ? inputReadOnly : inputNormal}
                    />
                  </FieldWrap>
                </div>

                {/* Country */}
                <FieldWrap label={t("country")}>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    disabled={usingSavedAddress}
                    className={usingSavedAddress ? inputReadOnly : inputNormal}
                  >
                    <option>Bangladesh</option>
                    <option>India</option>
                    <option>Pakistan</option>
                    <option>Other</option>
                  </select>
                </FieldWrap>

                {/* Notes — collapsible */}
                <div>
                  <button
                    type="button"
                    onClick={() => setNotesOpen((o) => !o)}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-[var(--color-text)] transition-colors"
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

              <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
                <Lock size={12} />
                {t("secureCheckout") || "Your information is encrypted and secure"}
              </div>
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
                  <div key={`${item.productId}-${idx}`} className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 bg-surface overflow-hidden relative shrink-0"
                      style={{ borderRadius: "var(--border-radius)" }}
                    >
                      {item.thumbnail ? (
                        <Image src={item.thumbnail} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <ShoppingBag size={16} className="m-auto mt-3 text-text-tertiary" />
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-700 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate leading-snug">{item.productName}</p>
                      {Object.keys(item.variantSelections || {}).length > 0 && (
                        <p className="text-[11px] text-text-tertiary truncate">
                          {Object.entries(item.variantSelections).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </p>
                      )}
                      <p className="text-[11px] text-text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold shrink-0" style={{ color: "var(--color-price)" }}>
                      ৳{(item.priceAtAdd * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="px-5 pb-5 pt-3 border-t border-border-subtle space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span>{t("subtotal")}</span>
                  <span className="shrink-0 font-medium">৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between gap-3 text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <Tag size={12} /> {coupon?.code}
                    </span>
                    <span className="shrink-0 font-medium">-৳{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Truck size={13} />{t("shipping")}
                  </span>
                  <span className="shrink-0 font-medium text-green-600 dark:text-green-400">Free</span>
                </div>

                <div className="pt-3 mt-1 border-t border-border-subtle flex items-center justify-between gap-3">
                  <span className="font-bold">{t("total")}</span>
                  <span
                    className="font-extrabold text-xl shrink-0"
                    style={{ color: "var(--color-price)" }}
                  >
                    ৳{total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5">
                {serverError && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
                    {serverError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-[var(--shadow-md)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    borderRadius: "var(--border-radius)",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      {t("placingOrder")}
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      {t("placeOrder")}
                    </>
                  )}
                </button>

                <p className="mt-2.5 text-[11px] text-text-tertiary text-center">
                  {t("secureCheckout") || "SSL encrypted · Safe & secure checkout"}
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
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="ml-1 text-text-tertiary font-normal">({optional})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

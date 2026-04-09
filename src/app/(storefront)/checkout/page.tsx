"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import { ShoppingBag, Loader2 } from "lucide-react";
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

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const tenant = useTenant();

  useEffect(() => {
    document.title = `Checkout | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Saved address state
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
          // Pre-fill form with default address
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
      // ignore - guest checkout
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) loadSavedAddresses();
  }, [mounted, loadSavedAddresses]);

  // Redirect to cart if empty (only after hydration)
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
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
      setForm((f) => ({
        ...f,
        street: "",
        city: "",
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
    // Select the newly added address (last one)
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-8">{t("checkout")}</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Saved addresses selector */}
            {isLoggedIn && savedAddresses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] p-7">
                <AddressSelector
                  addresses={savedAddresses}
                  onSelect={handleAddressSelect}
                  onSaveNew={handleSaveNewAddress}
                />
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] p-7">
              <h2 className="font-bold text-lg mb-5">{t("deliveryInfo")}</h2>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fullName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder={t("fullName")}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      errors.name
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("phoneNumber")} <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex items-center border rounded-lg overflow-hidden transition-colors ${
                      errors.phone ? "border-red-400" : "border-gray-200"
                    }`}
                  >
                    <span className="px-3 py-2.5 text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-200 shrink-0 select-none">
                      +88
                    </span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="01XXXXXXXXX"
                      maxLength={11}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("emailAddress")}{" "}
                    <span className="text-gray-400 font-normal">{t("optional")}</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("streetAddress")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, street: e.target.value }))
                    }
                    readOnly={usingSavedAddress}
                    placeholder={t("streetAddress")}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      usingSavedAddress ? "bg-gray-50 text-gray-500" : ""
                    } ${
                      errors.street
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                    }`}
                  />
                  {errors.street && (
                    <p className="mt-1 text-xs text-red-500">{errors.street}</p>
                  )}
                </div>

                {/* City + Postal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("city")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      readOnly={usingSavedAddress}
                      placeholder={t("city")}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                        usingSavedAddress ? "bg-gray-50 text-gray-500" : ""
                      } ${
                        errors.city
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("postalCode")}
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, postalCode: e.target.value }))
                      }
                      readOnly={usingSavedAddress}
                      placeholder={t("postalCode")}
                      className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors ${
                        usingSavedAddress ? "bg-gray-50 text-gray-500" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("country")}
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    disabled={usingSavedAddress}
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors bg-white ${
                      usingSavedAddress ? "bg-gray-50 text-gray-500" : ""
                    }`}
                  >
                    <option>Bangladesh</option>
                    <option>India</option>
                    <option>Pakistan</option>
                    <option>Other</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("orderNotes")} {t("optional")}
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder={t("orderNotes")}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] p-7">
              <h2 className="font-bold text-lg mb-4">{t("paymentMethod")}</h2>
              <label
                className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg border"
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
                  className="w-4 h-4 accent-current"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <div>
                  <p className="text-sm font-medium">{t("cashOnDelivery")}</p>
                  <p className="text-xs text-gray-500">
                    {t("payWhenReceive")}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-[var(--shadow-xs)] p-7 sticky top-24">
              <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.productName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ShoppingBag
                          size={16}
                          className="m-auto mt-3 text-gray-400"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold shrink-0">
                      ৳{(item.priceAtAdd * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t("subtotal")}</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("shipping")}</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
                <span>{t("total")}</span>
                <span>৳{subtotal.toLocaleString()}</span>
              </div>

              {serverError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full flex items-center justify-center gap-2 py-4 text-white font-semibold transition-all hover:brightness-105 hover:shadow-[var(--shadow-md)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t("placingOrder")}
                  </>
                ) : (
                  t("placeOrder")
                )}
              </button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                {t("backToCart")}
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

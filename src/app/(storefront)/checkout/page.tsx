"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/shared/context/CartContext";
import { ShoppingBag, Loader2 } from "lucide-react";

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
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to cart if empty (only after hydration)
  useEffect(() => {
    if (mounted && items.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, items.length, router]);

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    const phone = form.phone.trim().replace(/\s/g, "");
    if (!phone) {
      e.phone = "Phone number is required";
    } else if (!/^[0-9]{11}$/.test(phone)) {
      e.phone = "Phone number must be exactly 11 digits";
    }
    if (!form.street.trim()) e.street = "Address is required";
    if (!form.city.trim()) e.city = "City is required";
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
        setServerError(data.error || "Failed to place order. Please try again.");
        return;
      }

      clearCart();
      router.push(`/orders/${data.orderId}?confirmed=1`);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping form */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-5">Delivery Information</h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Your full name"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      errors.name
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
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
                    Email Address{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, street: e.target.value }))
                    }
                    placeholder="House, road, area"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                      errors.street
                        ? "border-red-400 focus:ring-red-200"
                        : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
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
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder="Dhaka"
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                        errors.city
                          ? "border-red-400 focus:ring-red-200"
                          : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                      }`}
                    />
                    {errors.city && (
                      <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, postalCode: e.target.value }))
                      }
                      placeholder="1200"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors bg-white"
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
                    Order Notes (optional)
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Any special instructions..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="font-bold text-lg mb-4">Payment Method</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  defaultChecked
                  readOnly
                  className="w-4 h-4 accent-current"
                  style={{ accentColor: "var(--color-primary)" }}
                />
                <div>
                  <p className="text-sm font-medium">Cash on Delivery</p>
                  <p className="text-xs text-gray-500">
                    Pay when you receive your order
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-4">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>

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
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold">
                <span>Total</span>
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
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "var(--color-primary)",
                  borderRadius: "var(--border-radius)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>

              <Link
                href="/cart"
                className="mt-3 block text-center text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

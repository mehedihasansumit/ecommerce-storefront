"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Package,
  User,
  MapPin,
  CreditCard,
  Tag,
  StickyNote,
  Plus,
  Minus,
  X,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";
import type { IProduct, IProductVariant } from "@/features/products/types";

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  thumbnail: string;
  price: number;
  quantity: number;
  stock: number;
  variantSelections: Record<string, string>;
}

function getProductName(product: IProduct): string {
  if (typeof product.name === "string") return product.name;
  return product.name.en ?? Object.values(product.name)[0] ?? "";
}

function variantKey(selections: Record<string, string>): string {
  return Object.entries(selections)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

function makeLineKey(productId: string, selections: Record<string, string>): string {
  const suffix = variantKey(selections);
  return suffix ? `${productId}::${suffix}` : productId;
}

function findMatchingVariant(
  product: IProduct,
  selections: Record<string, string>
): IProductVariant | null {
  if (!product.variants?.length || !product.options?.length) return null;
  return (
    product.variants.find((v) =>
      Object.entries(selections).every(
        ([k, val]) => v.optionValues?.[k] === val
      )
    ) ?? null
  );
}

export function CreateOrderForm({ storeId }: { storeId: string }) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<LineItem[]>([]);
  const [variantPickerProduct, setVariantPickerProduct] = useState<IProduct | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      setShowResults(true);
      try {
        const res = await fetch(
          `/api/products?storeId=${storeId}&search=${encodeURIComponent(query)}&limit=10`
        );
        const json = await res.json();
        setSearchResults(Array.isArray(json.data) ? json.data : json.data?.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, storeId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePickProduct(product: IProduct) {
    if (product.stock < 1 && (!product.variants?.length)) return;
    // If product has options, open variant picker
    if (product.options?.length) {
      setVariantPickerProduct(product);
      setQuery("");
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    addLineItem(product, {}, 1);
    setQuery("");
    setSearchResults([]);
    setShowResults(false);
  }

  function addLineItem(
    product: IProduct,
    selections: Record<string, string>,
    qty: number
  ) {
    const variant = findMatchingVariant(product, selections);
    const price = variant?.price ?? product.price;
    const stock = variant?.stock ?? product.stock;
    const key = makeLineKey(product._id, selections);

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(i.quantity + qty, stock) }
            : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product._id,
          productName: getProductName(product),
          thumbnail: variant?.images?.[0]?.url || product.thumbnail || "",
          price,
          quantity: Math.min(qty, stock),
          stock,
          variantSelections: selections,
        },
      ];
    });
  }

  function updateQty(key: string, qty: number) {
    if (qty < 1) {
      removeItem(key);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.key === key ? { ...i, quantity: Math.min(qty, i.stock) } : i
      )
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Add at least one product to the order.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items: items.map(({ productId, quantity, variantSelections }) => ({
            productId,
            quantity,
            variantSelections,
          })),
          shippingAddress: {
            name,
            phone,
            street,
            city,
            postalCode,
            state: "",
            country: "Bangladesh",
          },
          guestEmail: email || undefined,
          paymentMethod,
          notes,
          couponCode: couponCode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create order");
        return;
      }
      router.push(`/admin/stores/${storeId}/orders/${data.orderId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <section className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
              <Package className="w-4 h-4 text-admin-text-muted" />
              <h2 className="font-semibold text-sm text-gray-800">Products</h2>
              {items.length > 0 && (
                <span className="ml-auto text-xs text-admin-text-muted">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </header>

            <div className="p-5">
              <div className="relative" ref={searchBoxRef}>
                <Search className="w-4 h-4 text-admin-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => query.trim() && setShowResults(true)}
                  placeholder="Search products by name or tag…"
                  className="w-full border border-admin-border-md rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-admin-surface border border-admin-border rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
                    {searching && (
                      <div className="px-3 py-3 flex items-center gap-2 text-sm text-admin-text-muted">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching…
                      </div>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <p className="px-3 py-3 text-sm text-admin-text-subtle">
                        No products found.
                      </p>
                    )}
                    {!searching &&
                      searchResults.map((p) => {
                        const pName = getProductName(p);
                        const hasOptions = (p.options?.length ?? 0) > 0;
                        const out = !hasOptions && p.stock < 1;
                        return (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => handlePickProduct(p)}
                            disabled={out}
                            className="w-full text-left px-3 py-2 hover:bg-admin-surface-hover flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-50 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
                              {p.thumbnail ? (
                                <Image
                                  src={p.thumbnail}
                                  alt={pName}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-admin-text-subtle absolute inset-0 m-auto" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-gray-900">
                                {pName}
                              </p>
                              <p className="text-xs text-admin-text-muted">
                                ৳{p.price.toLocaleString()} ·{" "}
                                {hasOptions ? (
                                  <span className="text-admin-text-muted">
                                    {p.options.length}{" "}
                                    {p.options.length === 1 ? "option" : "options"}
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      out
                                        ? "text-red-500 font-medium"
                                        : "text-admin-text-muted"
                                    }
                                  >
                                    {out ? "Out of stock" : `${p.stock} in stock`}
                                  </span>
                                )}
                              </p>
                            </div>
                            {!out && (
                              <Plus className="w-4 h-4 text-admin-text-subtle shrink-0" />
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Selected items */}
              <div className="mt-4">
                {items.length === 0 ? (
                  <div className="py-10 text-center">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-admin-text-muted">
                      No products added yet. Search above to add items.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-admin-border">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="flex items-center gap-3 py-3"
                      >
                        <div className="w-12 h-12 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-admin-text-subtle absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          {Object.keys(item.variantSelections).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(item.variantSelections).map(
                                ([k, v]) => (
                                  <span
                                    key={k}
                                    className="inline-flex items-center text-[10px] font-medium text-admin-text-secondary bg-admin-chip px-1.5 py-0.5 rounded"
                                  >
                                    {k}: {v}
                                  </span>
                                )
                              )}
                            </div>
                          )}
                          <p className="text-xs text-admin-text-muted mt-0.5">
                            ৳{item.price.toLocaleString()} each · {item.stock}{" "}
                            in stock
                          </p>
                        </div>
                        <div className="flex items-center border border-admin-border rounded-lg overflow-hidden shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.key, item.quantity - 1)
                            }
                            className="w-8 h-8 flex items-center justify-center hover:bg-admin-surface-hover active:bg-admin-chip transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.key, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center hover:bg-admin-surface-hover active:bg-admin-chip disabled:opacity-40 disabled:cursor-not-allowed transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-20 text-right text-sm font-semibold text-gray-900 shrink-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.key)}
                          className="w-8 h-8 flex items-center justify-center text-admin-text-subtle hover:text-red-600 hover:bg-red-50 rounded-md transition shrink-0"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Customer */}
          <section className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
              <User className="w-4 h-4 text-admin-text-muted" />
              <h2 className="font-semibold text-sm text-gray-800">Customer</h2>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahim Uddin"
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-admin-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full border border-admin-border-md rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  />
                </div>
                <p className="text-[11px] text-admin-text-subtle mt-1">
                  Bangladesh format, e.g. 017XXXXXXXX
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-admin-text-subtle absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="optional@example.com"
                    className="w-full border border-admin-border-md rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
              <MapPin className="w-4 h-4 text-admin-text-muted" />
              <h2 className="font-semibold text-sm text-gray-800">
                Delivery Address
              </h2>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="House, road, area"
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dhaka"
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Postal Code
                </label>
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1207"
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                />
              </div>
            </div>
          </section>

          {/* Payment & notes */}
          <section className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
            <header className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-admin-text-muted" />
              <h2 className="font-semibold text-sm text-gray-800">
                Payment &amp; Notes
              </h2>
            </header>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-admin-text-secondary mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition bg-admin-surface"
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-admin-text-secondary mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" />
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes about this order (optional)"
                  className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — sticky summary */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-admin-surface rounded-xl border border-admin-border shadow-sm overflow-hidden">
              <header className="px-5 py-4 border-b border-admin-border">
                <h2 className="font-semibold text-sm text-gray-800">
                  Order Summary
                </h2>
              </header>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-admin-text-secondary mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Coupon Code
                  </label>
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Optional"
                    className="w-full border border-admin-border-md rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition uppercase"
                  />
                  <p className="text-[11px] text-admin-text-subtle mt-1">
                    Validated on submit.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-admin-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-admin-text-secondary">
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </span>
                    <span className="font-medium text-gray-900">
                      ৳{subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-admin-text-secondary">Shipping</span>
                    <span className="text-admin-text-subtle">Calculated later</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-1 border-t border-admin-border text-base font-semibold">
                    <span>Total</span>
                    <span>৳{subtotal.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || items.length === 0}
                    className="w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create Order"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full px-5 py-2.5 bg-admin-surface border border-admin-border-md text-sm font-medium rounded-lg hover:bg-admin-surface-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </form>

      {variantPickerProduct && (
        <VariantPickerModal
          product={variantPickerProduct}
          onCancel={() => setVariantPickerProduct(null)}
          onConfirm={(selections, qty) => {
            addLineItem(variantPickerProduct, selections, qty);
            setVariantPickerProduct(null);
          }}
        />
      )}
    </>
  );
}

function VariantPickerModal({
  product,
  onCancel,
  onConfirm,
}: {
  product: IProduct;
  onCancel: () => void;
  onConfirm: (selections: Record<string, string>, qty: number) => void;
}) {
  const productName = getProductName(product);
  const options = product.options ?? [];
  const variants = product.variants ?? [];

  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.name, o.values[0] ?? ""]))
  );
  const [qty, setQty] = useState(1);

  const activeVariant = useMemo(
    () => findMatchingVariant(product, selections),
    [product, selections]
  );

  const displayPrice = activeVariant?.price ?? product.price;
  const displayStock = activeVariant?.stock ?? product.stock;
  const outOfStock = displayStock <= 0;

  function isValueAvailable(optionName: string, value: string): boolean {
    if (variants.length === 0) return true;
    return variants.some(
      (v) =>
        v.optionValues?.[optionName] === value &&
        Object.entries(selections)
          .filter(([k]) => k !== optionName)
          .every(([k, val]) => v.optionValues?.[k] === val) &&
        (v.stock ?? 0) > 0
    );
  }

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onCancel]);

  const thumb = activeVariant?.images?.[0]?.url || product.thumbnail || "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-admin-surface rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <h3 className="font-semibold text-sm text-gray-900">Select Variant</h3>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center text-admin-text-subtle hover:text-admin-text-secondary hover:bg-admin-chip rounded-md transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <Package className="w-5 h-5 text-admin-text-subtle absolute inset-0 m-auto" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {productName}
              </p>
              <p className="text-xs text-admin-text-muted">
                ৳{displayPrice.toLocaleString()} ·{" "}
                <span
                  className={outOfStock ? "text-red-500 font-medium" : ""}
                >
                  {outOfStock ? "Out of stock" : `${displayStock} in stock`}
                </span>
              </p>
            </div>
          </div>

          {options.map((option) => (
            <div key={option.name}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-admin-text-muted">
                {option.name}
                {selections[option.name] && (
                  <span className="font-normal text-admin-text-secondary ml-1 normal-case">
                    — {selections[option.name]}
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => {
                  const available = isValueAvailable(option.name, value);
                  const selected = selections[option.name] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSelections((prev) => ({
                          ...prev,
                          [option.name]: value,
                        }))
                      }
                      disabled={!available}
                      className={`px-3 py-1.5 border text-xs font-medium rounded-md transition ${
                        selected
                          ? "border-gray-900 bg-gray-900 text-white"
                          : available
                          ? "border-admin-border-md text-admin-text-secondary hover:border-gray-500"
                          : "border-admin-border text-gray-300 cursor-not-allowed line-through"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2">
            <label className="text-xs font-medium text-admin-text-secondary">Qty</label>
            <div className="flex items-center border border-admin-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-8 h-8 flex items-center justify-center hover:bg-admin-surface-hover disabled:opacity-40 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-9 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(displayStock, q + 1))}
                disabled={qty >= displayStock || outOfStock}
                className="w-8 h-8 flex items-center justify-center hover:bg-admin-surface-hover disabled:opacity-40 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <footer className="px-5 py-4 border-t border-admin-border flex gap-2 justify-end bg-admin-surface-raised">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-admin-surface border border-admin-border-md text-sm font-medium rounded-lg hover:bg-admin-surface-hover transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onConfirm(selections, qty)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Add to Order
          </button>
        </footer>
      </div>
    </div>
  );
}

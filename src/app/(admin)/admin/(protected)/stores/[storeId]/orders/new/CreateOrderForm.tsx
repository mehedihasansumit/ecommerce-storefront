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
  Phone,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { IProduct, IProductVariant } from "@/features/products/types";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/shared/components/ui";

const QTY_BTN =
  "w-10 h-10 flex items-center justify-center text-admin-text-secondary hover:bg-admin-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-ring";

function FormSection({
  icon: Icon,
  title,
  meta,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card padding="none" className="overflow-hidden">
      <header className="px-5 py-4 border-b border-admin-border flex items-center gap-2">
        {Icon && <Icon aria-hidden className="w-4 h-4 text-admin-text-muted" />}
        <h2 className="font-semibold text-sm text-admin-text-primary">{title}</h2>
        {meta && <span className="ml-auto text-xs text-admin-text-muted">{meta}</span>}
      </header>
      {children}
    </Card>
  );
}

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
    // Clearing results for an empty query happens in handleQueryChange.
    if (!query.trim()) return;
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

  function handleQueryChange(next: string) {
    setQuery(next);
    if (!next.trim()) {
      setSearchResults([]);
      setShowResults(false);
    }
  }

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
          <FormSection
            icon={Package}
            title="Products"
            meta={
              items.length > 0
                ? `${itemCount} ${itemCount === 1 ? "item" : "items"}`
                : undefined
            }
          >
            <div className="p-5">
              <div className="relative" ref={searchBoxRef}>
                <Search
                  aria-hidden
                  className="w-4 h-4 text-admin-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onFocus={() => query.trim() && setShowResults(true)}
                  placeholder="Search products by name or tag…"
                  aria-label="Search products"
                  aria-expanded={showResults}
                  aria-controls="product-search-results"
                  autoComplete="off"
                  className="pl-9"
                />
                {showResults && (
                  <div
                    id="product-search-results"
                    className="absolute top-full left-0 right-0 mt-2 bg-admin-surface border border-admin-border rounded-xl shadow-lg z-20 max-h-72 overflow-y-auto"
                  >
                    {searching && (
                      <div
                        role="status"
                        className="px-3 py-3 flex items-center gap-2 text-sm text-admin-text-muted"
                      >
                        <Loader2 aria-hidden className="w-4 h-4 animate-spin" />
                        Searching…
                      </div>
                    )}
                    {!searching && searchResults.length === 0 && (
                      <p role="status" className="px-3 py-3 text-sm text-admin-text-muted">
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
                            className="w-full text-left px-3 py-2 hover:bg-admin-surface-hover flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border-b border-admin-border last:border-0 transition-colors focus-ring"
                          >
                            <div className="w-10 h-10 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
                              {p.thumbnail ? (
                                <Image
                                  src={p.thumbnail}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <Package aria-hidden className="w-4 h-4 text-admin-text-muted absolute inset-0 m-auto" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-admin-text-primary">
                                {pName}
                              </p>
                              <p className="text-xs text-admin-text-muted">
                                ৳{p.price.toLocaleString()} ·{" "}
                                {hasOptions ? (
                                  <span>
                                    {p.options.length}{" "}
                                    {p.options.length === 1 ? "option" : "options"}
                                  </span>
                                ) : (
                                  <span
                                    className={
                                      out ? "text-red-600 dark:text-red-400 font-medium" : undefined
                                    }
                                  >
                                    {out ? "Out of stock" : `${p.stock} in stock`}
                                  </span>
                                )}
                              </p>
                            </div>
                            {!out && (
                              <Plus aria-hidden className="w-4 h-4 text-admin-text-muted shrink-0" />
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
                  <EmptyState
                    icon={ShoppingBag}
                    title="No products added yet"
                    description="Search above to add items."
                    className="py-10"
                  />
                ) : (
                  <ul className="divide-y divide-admin-border">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="flex flex-wrap sm:flex-nowrap items-center gap-3 py-3"
                      >
                        <div className="w-12 h-12 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <Package aria-hidden className="w-5 h-5 text-admin-text-muted absolute inset-0 m-auto" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-admin-text-primary truncate">
                            {item.productName}
                          </p>
                          {Object.keys(item.variantSelections).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {Object.entries(item.variantSelections).map(
                                ([k, v]) => (
                                  <span
                                    key={k}
                                    className="inline-flex items-center text-xs font-medium text-admin-chip-text bg-admin-chip px-1.5 py-0.5 rounded"
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
                        <div
                          role="group"
                          aria-label={`Quantity for ${item.productName}`}
                          className="flex items-center border border-admin-border-md rounded-lg overflow-hidden shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.key, item.quantity - 1)
                            }
                            className={QTY_BTN}
                            aria-label="Decrease quantity"
                          >
                            <Minus aria-hidden className="w-3.5 h-3.5" />
                          </button>
                          <span
                            aria-live="polite"
                            className="w-9 text-center text-sm font-semibold text-admin-text-primary"
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQty(item.key, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            className={QTY_BTN}
                            aria-label="Increase quantity"
                          >
                            <Plus aria-hidden className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-20 text-right text-sm font-semibold text-admin-text-primary shrink-0 ml-auto sm:ml-0">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <X aria-hidden className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </FormSection>

          {/* Customer */}
          <FormSection icon={User} title="Customer">
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required className="sm:col-span-2">
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahim Uddin"
                  autoComplete="name"
                />
              </Field>
              <Field label="Phone" required hint="Bangladesh format, e.g. 017XXXXXXXX">
                <Input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  autoComplete="tel"
                  prefix={<Phone aria-hidden className="w-4 h-4" />}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="optional@example.com"
                  autoComplete="email"
                  prefix={<Mail aria-hidden className="w-4 h-4" />}
                />
              </Field>
            </div>
          </FormSection>

          {/* Delivery */}
          <FormSection icon={MapPin} title="Delivery Address">
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street Address" required className="sm:col-span-2">
                <Input
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="House, road, area"
                  autoComplete="street-address"
                />
              </Field>
              <Field label="City" required>
                <Input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dhaka"
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Postal Code">
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="e.g. 1207"
                  autoComplete="postal-code"
                />
              </Field>
            </div>
          </FormSection>

          {/* Payment & notes */}
          <FormSection icon={CreditCard} title="Payment & Notes">
            <div className="p-5 space-y-4">
              <Field label="Payment Method">
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cod">Cash on Delivery</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                </Select>
              </Field>
              <Field
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <StickyNote aria-hidden className="w-3.5 h-3.5" />
                    Notes
                  </span>
                }
              >
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Internal notes about this order (optional)"
                  className="resize-none"
                />
              </Field>
            </div>
          </FormSection>
        </div>

        {/* RIGHT COLUMN — sticky summary */}
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <FormSection title="Order Summary">
              <div className="p-5 space-y-4">
                <Field
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <Tag aria-hidden className="w-3.5 h-3.5" />
                      Coupon Code
                    </span>
                  }
                  hint="Validated on submit."
                >
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Optional"
                    className="uppercase"
                  />
                </Field>

                <dl className="space-y-2 pt-2 border-t border-admin-border">
                  <div className="flex justify-between text-sm">
                    <dt className="text-admin-text-secondary">
                      Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                    </dt>
                    <dd className="font-medium text-admin-text-primary">
                      ৳{subtotal.toLocaleString()}
                    </dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-admin-text-secondary">Shipping</dt>
                    <dd className="text-admin-text-muted">Calculated later</dd>
                  </div>
                  <div className="flex justify-between pt-3 mt-1 border-t border-admin-border text-base font-semibold text-admin-text-primary">
                    <dt>Total</dt>
                    <dd>৳{subtotal.toLocaleString()}</dd>
                  </div>
                </dl>

                {error && <Alert tone="error">{error}</Alert>}

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={submitting}
                    disabled={items.length === 0}
                  >
                    Create Order
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </FormSection>
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

  const thumb = activeVariant?.images?.[0]?.url || product.thumbnail || "";

  return (
    <Modal
      open
      onClose={onCancel}
      title="Select Variant"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={outOfStock}
            onClick={() => onConfirm(selections, qty)}
          >
            Add to Order
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-md bg-admin-chip overflow-hidden shrink-0 relative">
            {thumb ? (
              <Image
                src={thumb}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <Package aria-hidden className="w-5 h-5 text-admin-text-muted absolute inset-0 m-auto" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-admin-text-primary truncate">
              {productName}
            </p>
            <p className="text-xs text-admin-text-muted">
              ৳{displayPrice.toLocaleString()} ·{" "}
              <span
                className={outOfStock ? "text-red-600 dark:text-red-400 font-medium" : ""}
              >
                {outOfStock ? "Out of stock" : `${displayStock} in stock`}
              </span>
            </p>
          </div>
        </div>

        {options.map((option) => (
          <div key={option.name} role="group" aria-label={option.name}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-admin-text-muted">
              {option.name}
              {selections[option.name] && (
                <span className="font-normal text-admin-text-secondary ml-1 normal-case">
                  — {selections[option.name]}
                </span>
              )}
            </p>
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
                    aria-pressed={selected}
                    className={`min-h-10 px-3 py-1.5 border text-xs font-medium rounded-lg transition-colors focus-ring ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
                        : available
                        ? "border-admin-border-md text-admin-text-secondary hover:bg-admin-surface-hover"
                        : "border-admin-border text-admin-text-subtle cursor-not-allowed line-through"
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
          <span id="variant-qty-label" className="text-sm font-medium text-admin-text-secondary">
            Qty
          </span>
          <div
            role="group"
            aria-labelledby="variant-qty-label"
            className="flex items-center border border-admin-border-md rounded-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className={QTY_BTN}
              aria-label="Decrease quantity"
            >
              <Minus aria-hidden className="w-3.5 h-3.5" />
            </button>
            <span aria-live="polite" className="w-9 text-center text-sm font-semibold text-admin-text-primary">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(displayStock, q + 1))}
              disabled={qty >= displayStock || outOfStock}
              className={QTY_BTN}
              aria-label="Increase quantity"
            >
              <Plus aria-hidden className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

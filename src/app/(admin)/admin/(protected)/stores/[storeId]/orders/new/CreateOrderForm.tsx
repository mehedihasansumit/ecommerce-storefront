"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { IProduct } from "@/features/products/types";

interface LineItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  stock: number;
}

export function CreateOrderForm({ storeId }: { storeId: string }) {
  const router = useRouter();

  // Product search
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cart items
  const [items, setItems] = useState<LineItem[]>([]);

  // Customer info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Debounced product search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/products?storeId=${storeId}&search=${encodeURIComponent(query)}&limit=10`
        );
        const json = await res.json();
        setSearchResults(json.data?.data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, storeId]);

  function addProduct(product: IProduct) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i
        );
      }
      const name =
        typeof product.name === "string"
          ? product.name
          : product.name.en ?? Object.values(product.name)[0] ?? "";
      return [
        ...prev,
        {
          productId: product._id,
          productName: name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
    setQuery("");
    setSearchResults([]);
  }

  function updateQty(productId: string, qty: number) {
    if (qty < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(qty, i.stock) }
            : i
        )
      );
    }
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (items.length === 0) {
      setError("Add at least one product.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items: items.map(({ productId, quantity }) => ({
            productId,
            quantity,
            variantSelections: {},
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Product search */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
          Products
        </h2>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          {(searchResults.length > 0 || searching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-56 overflow-y-auto">
              {searching && (
                <p className="px-3 py-2 text-sm text-gray-400">Searching…</p>
              )}
              {searchResults.map((p) => {
                const pName =
                  typeof p.name === "string"
                    ? p.name
                    : p.name.en ?? Object.values(p.name)[0] ?? "";
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between gap-4"
                  >
                    <span className="text-sm font-medium truncate">{pName}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      ৳{p.price.toLocaleString()} · stock {p.stock}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected items */}
        {items.length > 0 && (
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-4 py-2 border-t border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-gray-500">
                    ৳{item.price.toLocaleString()} each
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity - 1)}
                    className="w-7 h-7 rounded border border-gray-300 text-sm font-bold hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="w-7 h-7 rounded border border-gray-300 text-sm font-bold hover:bg-gray-100 disabled:opacity-40"
                  >
                    +
                  </button>
                  <span className="w-20 text-right text-sm font-semibold">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-sm">
              <span>Total</span>
              <span>৳{subtotal.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-4">
          Customer &amp; Delivery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Postal Code
            </label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <option value="cod">Cash on Delivery</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating…" : "Create Order"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

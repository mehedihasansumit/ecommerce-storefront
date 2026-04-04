"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Package, Loader2 } from "lucide-react";
import type { IOrder } from "@/features/orders/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    async function load() {
      const [{ id }, sp] = await Promise.all([params, searchParams]);
      setOrderId(id);
      setConfirmed(sp.confirmed === "1");

      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Order not found");
        } else {
          setOrder(data.order);
        }
      } catch {
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, searchParams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64 py-20">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">{error || "Order not found"}</p>
        <Link
          href="/products"
          className="text-sm underline text-gray-600 hover:text-gray-900"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Confirmation header */}
      {confirmed && (
        <div className="text-center mb-8">
          <CheckCircle
            size={48}
            className="mx-auto mb-3"
            style={{ color: "var(--color-primary)" }}
          />
          <h1 className="text-2xl font-bold mb-1">Order Placed!</h1>
          <p className="text-gray-500 text-sm">
            Thank you for your order. We&apos;ll contact you on{" "}
            <span className="font-medium text-gray-700">
              {order.shippingAddress.phone}
            </span>{" "}
            to confirm delivery.
          </p>
        </div>
      )}

      {!confirmed && (
        <h1 className="text-2xl font-bold mb-6">Order Detail</h1>
      )}

      {/* Order info card */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {/* Header */}
        <div className="p-5 flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Order Number
            </p>
            <p className="font-bold text-lg">{order.orderNumber}</p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, white)",
              color: "var(--color-primary)",
            }}
          >
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>

        {/* Items */}
        <div className="p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package size={15} />
            Items
          </p>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {Object.entries(item.variantSelections || {}).map(
                    ([k, v]) => (
                      <p key={k} className="text-xs text-gray-500">
                        {k}: {v}
                      </p>
                    )
                  )}
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold shrink-0">
                  ৳{item.totalPrice.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="p-5 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>৳{order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100 mt-1">
            <span>Total</span>
            <span>৳{order.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Delivery address */}
        <div className="p-5 text-sm">
          <p className="font-semibold mb-2">Delivery Address</p>
          <p className="text-gray-700">{order.shippingAddress.name}</p>
          <p className="text-gray-500">{order.shippingAddress.phone}</p>
          <p className="text-gray-500">{order.shippingAddress.street}</p>
          <p className="text-gray-500">
            {order.shippingAddress.city}
            {order.shippingAddress.postalCode
              ? `, ${order.shippingAddress.postalCode}`
              : ""}
          </p>
          <p className="text-gray-500">{order.shippingAddress.country}</p>
        </div>

        {/* Payment */}
        <div className="p-5 text-sm flex justify-between text-gray-600">
          <span>Payment</span>
          <span className="capitalize font-medium">
            {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
          </span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 text-white font-medium transition-opacity hover:opacity-90"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

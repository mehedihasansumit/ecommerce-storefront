"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { IOrder, PaymentStatus } from "@/features/orders/types";
import { Loader2, Check, Tag, ExternalLink } from "lucide-react";
import type { OrderStatus } from "@/features/orders/types";

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed:  "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-purple-50 text-purple-700 border-purple-200",
  shipped:    "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered:  "bg-green-50 text-green-700 border-green-200",
  cancelled:  "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid:     "bg-green-100 text-green-800 border-green-200",
  failed:   "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-admin-chip text-admin-text-secondary border-admin-border",
};

interface RowState {
  paymentStatus: PaymentStatus;
  discount: string;
  savingStatus: boolean;
  savingDiscount: boolean;
  statusError: string;
  discountError: string;
  statusSaved: boolean;
  discountSaved: boolean;
}

interface Props {
  orders: IOrder[];
  storeId: string;
}

export function PaymentsTable({ orders, storeId }: Props) {
  const router = useRouter();

  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      orders.map((o) => [
        o._id,
        {
          paymentStatus: o.paymentStatus,
          discount: String(o.discount ?? 0),
          savingStatus: false,
          savingDiscount: false,
          statusError: "",
          discountError: "",
          statusSaved: false,
          discountSaved: false,
        },
      ])
    )
  );

  function setRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function handleStatusChange(order: IOrder, newStatus: PaymentStatus) {
    const row = rows[order._id];
    if (newStatus === row.paymentStatus || row.savingStatus) return;

    const prev = row.paymentStatus;
    setRow(order._id, { paymentStatus: newStatus, savingStatus: true, statusError: "", statusSaved: false });

    const res = await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, paymentStatus: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      setRow(order._id, { paymentStatus: prev, savingStatus: false, statusError: data.error || "Failed" });
    } else {
      setRow(order._id, { savingStatus: false, statusSaved: true });
      router.refresh();
      setTimeout(() => setRow(order._id, { statusSaved: false }), 2000);
    }
  }

  async function handleDiscountApply(order: IOrder) {
    const row = rows[order._id];
    const val = parseFloat(row.discount);
    const max = order.subtotal + order.shippingCost + order.tax;

    if (isNaN(val) || val < 0) {
      setRow(order._id, { discountError: "Invalid amount" });
      return;
    }
    if (val > max) {
      setRow(order._id, { discountError: `Max ৳${max.toLocaleString()}` });
      return;
    }

    setRow(order._id, { savingDiscount: true, discountError: "", discountSaved: false });

    const res = await fetch(`/api/orders/${order._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, discount: val }),
    });

    if (!res.ok) {
      const data = await res.json();
      setRow(order._id, { savingDiscount: false, discountError: data.error || "Failed" });
    } else {
      setRow(order._id, { savingDiscount: false, discountSaved: true });
      router.refresh();
      setTimeout(() => setRow(order._id, { discountSaved: false }), 2000);
    }
  }

  return (
    <div className="bg-admin-surface rounded-xl border border-admin-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-225">
          <thead>
            <tr className="border-b border-admin-border bg-admin-surface-raised">
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Order</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Method</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Order Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Subtotal</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Discount</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Total</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Payment</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {orders.map((order) => {
              const row = rows[order._id];
              if (!row) return null;
              const discountNum = parseFloat(row.discount) || 0;
              const newTotal = Math.max(0, order.subtotal + order.shippingCost + order.tax - discountNum);

              return (
                <tr key={order._id} className="hover:bg-admin-surface-hover/60 transition-colors align-top">
                  {/* Order */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/admin/stores/${storeId}/orders/${order._id}`}
                        className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        {order.orderNumber}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      {order.couponCode && (
                        <span className="self-start px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {order.couponCode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.shippingAddress.name}</p>
                    <p className="text-xs text-admin-text-subtle">{order.shippingAddress.phone}</p>
                  </td>

                  {/* Method */}
                  <td className="px-5 py-4 text-sm text-admin-text-secondary capitalize">
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}
                  </td>

                  {/* Order status */}
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${
                        ORDER_STATUS_STYLES[order.status] ?? "bg-admin-surface-raised text-admin-text-secondary border-admin-border"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* Subtotal */}
                  <td className="px-5 py-4 text-sm text-right text-admin-text-secondary">
                    ৳{order.subtotal.toLocaleString()}
                  </td>

                  {/* Discount input */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-admin-text-subtle">৳</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.discount}
                          onChange={(e) => setRow(order._id, { discount: e.target.value, discountError: "" })}
                          className="w-full pl-6 pr-2 py-1.5 text-xs border border-admin-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                      </div>
                      <button
                        onClick={() => handleDiscountApply(order)}
                        disabled={row.savingDiscount}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
                        title="Apply discount"
                      >
                        {row.savingDiscount ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : row.discountSaved ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Tag className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    {row.discountError && (
                      <p className="text-xs text-red-500 mt-1">{row.discountError}</p>
                    )}
                    {discountNum > 0 && (
                      <p className="text-xs text-admin-text-subtle mt-1">
                        New: ৳{newTotal.toLocaleString()}
                      </p>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4 text-sm font-semibold text-right text-gray-900">
                    ৳{order.total.toLocaleString()}
                  </td>

                  {/* Payment status */}
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {PAYMENT_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(order, s)}
                          disabled={row.savingStatus}
                          className={`px-2 py-0.5 rounded-md text-xs font-medium border capitalize transition-all disabled:opacity-50 ${
                            row.paymentStatus === s
                              ? PAYMENT_STYLES[s]
                              : "bg-admin-surface text-admin-text-muted border-admin-border hover:border-gray-400"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="mt-1 h-4">
                      {row.savingStatus && (
                        <p className="text-xs text-admin-text-subtle flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                        </p>
                      )}
                      {row.statusSaved && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Saved
                        </p>
                      )}
                      {row.statusError && (
                        <p className="text-xs text-red-500">{row.statusError}</p>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

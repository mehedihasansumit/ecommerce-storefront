"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentStatus } from "@/features/orders/types";
import { CreditCard, Tag, Check, Loader2 } from "lucide-react";

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  paid:     "bg-green-100 text-green-800",
  failed:   "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-700",
};

interface Props {
  orderId: string;
  storeId: string;
  currentPaymentStatus: PaymentStatus;
  currentDiscount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
}

export function PaymentUpdater({
  orderId,
  storeId,
  currentPaymentStatus,
  currentDiscount,
  subtotal,
  shippingCost,
  tax,
}: Props) {
  const router = useRouter();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(currentPaymentStatus);
  const [discount, setDiscount] = useState<string>(String(currentDiscount));
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [discountSaved, setDiscountSaved] = useState(false);

  const maxDiscount = subtotal + shippingCost + tax;
  const discountNum = parseFloat(discount) || 0;
  const newTotal = Math.max(0, maxDiscount - discountNum);

  async function handlePaymentStatusChange(newStatus: PaymentStatus) {
    if (newStatus === paymentStatus) return;
    setSavingPayment(true);
    setPaymentError("");
    setPaymentSaved(false);
    const prev = paymentStatus;
    setPaymentStatus(newStatus);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, paymentStatus: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      setPaymentError(data.error || "Failed to update payment status");
      setPaymentStatus(prev);
    } else {
      setPaymentSaved(true);
      router.refresh();
      setTimeout(() => setPaymentSaved(false), 2000);
    }
    setSavingPayment(false);
  }

  async function handleDiscountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDiscountError("");
    setDiscountSaved(false);

    const val = parseFloat(discount);
    if (isNaN(val) || val < 0) {
      setDiscountError("Enter a valid discount amount");
      return;
    }
    if (val > maxDiscount) {
      setDiscountError(`Discount cannot exceed ৳${maxDiscount.toLocaleString()}`);
      return;
    }

    setSavingDiscount(true);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, discount: val }),
    });

    if (!res.ok) {
      const data = await res.json();
      setDiscountError(data.error || "Failed to apply discount");
    } else {
      setDiscountSaved(true);
      router.refresh();
      setTimeout(() => setDiscountSaved(false), 2000);
    }
    setSavingDiscount(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 px-5 py-4 space-y-5">
      <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
        Payment
      </h2>

      {/* Payment status */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
          <CreditCard className="w-3.5 h-3.5" />
          Payment Status
        </label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handlePaymentStatusChange(s)}
              disabled={savingPayment}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize disabled:opacity-50 ${
                paymentStatus === s
                  ? `${PAYMENT_STYLES[s]} border-transparent ring-2 ring-offset-1 ${
                      s === "paid" ? "ring-green-400"
                      : s === "pending" ? "ring-yellow-400"
                      : s === "failed" ? "ring-red-400"
                      : "ring-gray-400"
                    }`
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-1.5 h-4">
          {savingPayment && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </p>
          )}
          {paymentSaved && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Saved
            </p>
          )}
          {paymentError && <p className="text-xs text-red-500">{paymentError}</p>}
        </div>
      </div>

      {/* Discount */}
      <form onSubmit={handleDiscountSubmit}>
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
          <Tag className="w-3.5 h-3.5" />
          Discount
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
              ৳
            </span>
            <input
              type="number"
              min="0"
              max={maxDiscount}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
              placeholder="0"
            />
          </div>
          <button
            type="submit"
            disabled={savingDiscount}
            className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {savingDiscount ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Apply
          </button>
        </div>

        {discountNum > 0 && (
          <p className="mt-1.5 text-xs text-gray-500">
            New total: <span className="font-semibold text-gray-900">৳{newTotal.toLocaleString()}</span>
            <span className="ml-1 text-gray-400">(was ৳{maxDiscount.toLocaleString()})</span>
          </p>
        )}

        <div className="mt-1 h-4">
          {discountSaved && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" /> Discount applied
            </p>
          )}
          {discountError && <p className="text-xs text-red-500">{discountError}</p>}
        </div>
      </form>
    </div>
  );
}

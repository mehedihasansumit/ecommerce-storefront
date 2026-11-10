"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentStatus } from "@/features/orders/types";
import { CreditCard, Tag, Check, Loader2 } from "lucide-react";
import { Button, Card, Input } from "@/shared/components/ui";

const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed", "refunded"];

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
  paid:     "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300",
  failed:   "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  refunded: "bg-admin-chip text-admin-text-secondary",
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
    <Card padding="none" className="px-5 py-4 space-y-5">
      <h2 className="font-semibold text-sm text-admin-text-primary uppercase tracking-wide">
        Payment
      </h2>

      {/* Payment status */}
      <div role="group" aria-labelledby="payment-status-label">
        <p
          id="payment-status-label"
          className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted mb-2"
        >
          <CreditCard aria-hidden className="w-3.5 h-3.5" />
          Payment Status
        </p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handlePaymentStatusChange(s)}
              disabled={savingPayment}
              aria-pressed={paymentStatus === s}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize disabled:opacity-50 focus-ring ${
                paymentStatus === s
                  ? `${PAYMENT_STYLES[s]} border-transparent ring-2 ring-offset-1 ring-offset-admin-surface ${
                      s === "paid" ? "ring-green-400"
                      : s === "pending" ? "ring-yellow-400"
                      : s === "failed" ? "ring-red-400"
                      : "ring-gray-400"
                    }`
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:bg-admin-surface-hover"
              }`}
            >
              {paymentStatus === s && <Check aria-hidden className="inline w-3 h-3 mr-1 -mt-0.5" />}
              {s}
            </button>
          ))}
        </div>
        <div className="mt-1.5 min-h-4" aria-live="polite">
          {savingPayment && (
            <p className="text-xs text-admin-text-muted flex items-center gap-1">
              <Loader2 aria-hidden className="w-3 h-3 animate-spin" /> Saving…
            </p>
          )}
          {paymentSaved && (
            <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
              <Check aria-hidden className="w-3 h-3" /> Saved
            </p>
          )}
          {paymentError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400">{paymentError}</p>
          )}
        </div>
      </div>

      {/* Discount */}
      <form onSubmit={handleDiscountSubmit}>
        <label
          htmlFor="order-discount"
          className="flex items-center gap-1.5 text-xs font-medium text-admin-text-muted mb-2"
        >
          <Tag aria-hidden className="w-3.5 h-3.5" />
          Discount
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              id="order-discount"
              type="number"
              min="0"
              max={maxDiscount}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              prefix="৳"
              placeholder="0"
              invalid={!!discountError}
              aria-describedby={discountError ? "order-discount-error" : undefined}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            loading={savingDiscount}
            leftIcon={<Check aria-hidden className="w-3.5 h-3.5" />}
          >
            Apply
          </Button>
        </div>

        {discountNum > 0 && (
          <p className="mt-1.5 text-xs text-admin-text-muted">
            New total: <span className="font-semibold text-admin-text-primary">৳{newTotal.toLocaleString()}</span>
            <span className="ml-1">(was ৳{maxDiscount.toLocaleString()})</span>
          </p>
        )}

        <div className="mt-1 min-h-4" aria-live="polite">
          {discountSaved && (
            <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
              <Check aria-hidden className="w-3 h-3" /> Discount applied
            </p>
          )}
          {discountError && (
            <p id="order-discount-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
              {discountError}
            </p>
          )}
        </div>
      </form>
    </Card>
  );
}

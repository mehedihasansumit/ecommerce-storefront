"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import type { OrderStatus } from "@/features/orders/types";

const FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STEP_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

interface Props {
  orderId: string;
  storeId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusUpdater({ orderId, storeId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(newStatus: OrderStatus) {
    if (newStatus === status || saving) return;
    setSaving(true);
    setError("");
    const prev = status;
    setStatus(newStatus);

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, status: newStatus }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update status");
      setStatus(prev);
    } else {
      router.refresh();
    }
    setSaving(false);
  }

  const isCancelled = status === "cancelled";
  const currentIdx = FLOW.indexOf(status);

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      {isCancelled ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </span>
            <div>
              <p className="text-sm font-semibold text-red-600">Order Cancelled</p>
              <p className="text-xs text-gray-400 mt-0.5">This order has been cancelled</p>
            </div>
          </div>
          <button
            onClick={() => handleChange("pending")}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reopen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Step progress */}
          <div className="flex items-start">
            {FLOW.map((step, idx) => {
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;

              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => handleChange(step)}
                    disabled={saving}
                    className="flex flex-col items-center gap-1.5 group disabled:cursor-not-allowed min-w-0"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2"
                          : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs text-center leading-tight hidden sm:block ${
                        isCurrent
                          ? "font-semibold text-gray-900"
                          : isCompleted
                          ? "text-green-600 font-medium"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </button>

                  {idx < FLOW.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 mb-5 transition-all ${
                        currentIdx > idx ? "bg-green-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {saving ? (
                <span className="flex items-center gap-1 text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              ) : (
                "Click a step to update status"
              )}
            </span>
            <button
              onClick={() => handleChange("cancelled")}
              disabled={saving}
              className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
            >
              Cancel order
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 pt-2 border-t border-red-100">{error}</p>
      )}
    </div>
  );
}

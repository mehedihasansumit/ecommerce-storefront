"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { Alert, Button, Card, ConfirmDialog } from "@/shared/components/ui";
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
  const [confirmCancel, setConfirmCancel] = useState(false);

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
    <Card padding="none" className="px-5 py-4">
      {isCancelled ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <XCircle aria-hidden className="w-4 h-4 text-red-600 dark:text-red-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Order Cancelled</p>
              <p className="text-xs text-admin-text-muted mt-0.5">This order has been cancelled</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleChange("pending")}
            loading={saving}
            leftIcon={<RotateCcw aria-hidden className="w-3.5 h-3.5" />}
          >
            Reopen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Step progress */}
          <ol aria-label="Order status" className="flex items-start">
            {FLOW.map((step, idx) => {
              const isCompleted = currentIdx > idx;
              const isCurrent = currentIdx === idx;

              return (
                <li key={step} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => handleChange(step)}
                    disabled={saving}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${STEP_LABELS[step]}${isCompleted ? " (completed)" : isCurrent ? " (current)" : ""}`}
                    className="flex flex-col items-center gap-1.5 group min-w-10 min-h-10 rounded-lg disabled:cursor-not-allowed focus-ring"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : isCurrent
                          ? "bg-gray-900 text-white ring-2 ring-gray-900 ring-offset-2 ring-offset-admin-surface dark:bg-gray-100 dark:text-gray-900 dark:ring-gray-100"
                          : "bg-admin-chip text-admin-text-muted group-hover:bg-admin-surface-hover group-hover:text-admin-text-secondary"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 aria-hidden className="w-4 h-4" />
                      ) : (
                        <span aria-hidden className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className={`text-xs text-center leading-tight hidden sm:block ${
                        isCurrent
                          ? "font-semibold text-admin-text-primary"
                          : isCompleted
                          ? "text-green-700 dark:text-green-400 font-medium"
                          : "text-admin-text-muted group-hover:text-admin-text-secondary"
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </button>

                  {idx < FLOW.length - 1 && (
                    <div
                      aria-hidden
                      className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${
                        currentIdx > idx ? "bg-green-500" : "bg-admin-border-md"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Footer row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-admin-border">
            <span className="text-xs text-admin-text-muted" aria-live="polite">
              {saving ? (
                <span className="flex items-center gap-1">
                  <Loader2 aria-hidden className="w-3 h-3 animate-spin" /> Saving…
                </span>
              ) : (
                "Click a step to update status"
              )}
            </span>
            <Button
              variant="danger-outline"
              size="sm"
              onClick={() => setConfirmCancel(true)}
              disabled={saving}
            >
              Cancel order
            </Button>
            <ConfirmDialog
              open={confirmCancel}
              onClose={() => setConfirmCancel(false)}
              onConfirm={async () => {
                setConfirmCancel(false);
                await handleChange("cancelled");
              }}
              tone="danger"
              title="Cancel this order?"
              description="The order will be marked as cancelled. You can reopen it later."
              confirmLabel="Cancel order"
              cancelLabel="Keep order"
            />
          </div>
        </div>
      )}

      {error && (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      )}
    </Card>
  );
}

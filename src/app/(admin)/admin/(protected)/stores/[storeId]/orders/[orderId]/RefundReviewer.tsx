"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, DollarSign } from "lucide-react";
import type { IRefundRequest } from "@/features/orders/types";

interface Props {
  orderId: string;
  storeId: string;
  refundRequest: IRefundRequest;
}

export function RefundReviewer({ orderId, storeId, refundRequest }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approved" | "rejected" | "processed" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");

  async function act(action: "approved" | "rejected" | "processed") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/orders/${orderId}/refund`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action, adminNote: adminNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  const isPending = refundRequest.status === "pending";
  const isApproved = refundRequest.status === "approved";

  return (
    <div className="px-5 py-4 space-y-4">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-admin-text-muted">
          <span>Refund amount</span>
          <span className="font-semibold text-admin-text-secondary">
            ৳{refundRequest.refundAmount.toLocaleString()}
          </span>
        </div>
        <div className="text-admin-text-muted">
          <span className="font-medium">Reason: </span>
          <span className="text-admin-text-secondary">{refundRequest.reason}</span>
        </div>
        <div className="text-admin-text-subtle text-xs">
          Requested{" "}
          {new Date(refundRequest.requestedAt).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {(isPending || isApproved) && (
        <div>
          <label className="block text-xs font-medium text-admin-text-muted mb-1">
            Admin note (optional)
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Add a note for the customer..."
            className="w-full text-sm rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-text-secondary placeholder:text-admin-text-subtle resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      )}

      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={() => act("approved")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
          >
            {loading === "approved" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Approve
          </button>
          <button
            onClick={() => act("rejected")}
            disabled={loading !== null}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
          >
            {loading === "rejected" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            Reject
          </button>
        </div>
      )}

      {isApproved && (
        <button
          onClick={() => act("processed")}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
        >
          {loading === "processed" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <DollarSign className="w-3.5 h-3.5" />
          )}
          Mark as Processed
        </button>
      )}
    </div>
  );
}

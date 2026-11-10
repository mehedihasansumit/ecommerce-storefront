"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Alert, Button, Field, Textarea } from "@/shared/components/ui";
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
      {error && <Alert tone="error">{error}</Alert>}

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
        <div className="text-admin-text-muted text-xs">
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
        <Field label="Admin note" optional>
          <Textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={2}
            placeholder="Add a note for the customer..."
            className="resize-none"
          />
        </Field>
      )}

      {isPending && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => act("approved")}
            disabled={loading !== null && loading !== "approved"}
            loading={loading === "approved"}
            leftIcon={<CheckCircle aria-hidden className="w-3.5 h-3.5" />}
          >
            Approve
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => act("rejected")}
            disabled={loading !== null && loading !== "rejected"}
            loading={loading === "rejected"}
            leftIcon={<XCircle aria-hidden className="w-3.5 h-3.5" />}
          >
            Reject
          </Button>
        </div>
      )}

      {isApproved && (
        <Button
          variant="primary"
          onClick={() => act("processed")}
          loading={loading === "processed"}
          disabled={loading !== null}
          leftIcon={<DollarSign aria-hidden className="w-3.5 h-3.5" />}
        >
          Mark as Processed
        </Button>
      )}
    </div>
  );
}

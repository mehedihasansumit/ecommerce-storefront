"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/shared/components/ui";

interface BroadcastButtonProps {
  announcementId: string;
  storeId: string;
  initialSentAt?: Date | string | null;
  initialCount?: number;
}

export function BroadcastButton({
  announcementId,
  storeId,
  initialSentAt,
  initialCount = 0,
}: BroadcastButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    initialSentAt ? "done" : "idle"
  );
  const [sentCount, setSentCount] = useState(initialCount);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleBroadcast() {
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/announcements/${announcementId}/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId }),
      });

      const data = await res.json();

      if (res.ok) {
        const sent: number = data.sent ?? 0;
        setSentCount(sent);
        setStatus("done");
        toast.success(`Sent to ${sent} subscriber${sent !== 1 ? "s" : ""}`);
      } else {
        const msg = data?.error || "Failed to send";
        setErrorMsg(msg);
        setStatus("error");
        toast.error(msg);
      }
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
      toast.error("Network error");
    }
  }

  const dialog = (
    <ConfirmDialog
      open={confirmOpen}
      onClose={() => setConfirmOpen(false)}
      onConfirm={handleBroadcast}
      tone="primary"
      title="Send announcement?"
      description="This announcement will be emailed to all subscribers of this store."
      confirmLabel="Send"
    />
  );

  if (status === "done") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full"
        title={`Sent to ${sentCount} subscriber${sentCount !== 1 ? "s" : ""}`}
      >
        <CheckCircle size={11} />
        Sent ({sentCount})
      </span>
    );
  }

  if (status === "error") {
    return (
      <>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="p-2.5 text-red-400 hover:text-red-600 rounded-lg transition-colors"
          aria-label="Retry sending announcement to email subscribers"
          title={errorMsg || "Send failed — click to retry"}
        >
          <Send size={14} />
        </button>
        {dialog}
      </>
    );
  }

  if (status === "loading") {
    return (
      <span className="inline-flex p-2.5 text-admin-text-subtle" role="status" aria-label="Sending announcement">
        <Loader2 size={14} className="animate-spin" />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="p-2.5 text-admin-text-subtle hover:text-blue-600 rounded-lg transition-colors"
        aria-label="Send announcement to email subscribers"
        title="Send to email subscribers"
      >
        <Send size={14} />
      </button>
      {dialog}
    </>
  );
}

"use client";

import { useState } from "react";
import { Send, Loader2, CheckCircle } from "lucide-react";

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

  async function handleBroadcast() {
    if (!confirm("Send this announcement to all email subscribers?")) return;
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
        setSentCount(data.sent ?? 0);
        setStatus("done");
      } else {
        setErrorMsg(data?.error || "Failed to send");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error");
      setStatus("error");
    }
  }

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
      <button
        onClick={handleBroadcast}
        className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
        title={errorMsg || "Send failed — click to retry"}
      >
        <Send size={14} />
      </button>
    );
  }

  if (status === "loading") {
    return (
      <span className="p-1.5 text-admin-text-subtle">
        <Loader2 size={14} className="animate-spin" />
      </span>
    );
  }

  return (
    <button
      onClick={handleBroadcast}
      className="p-1.5 text-admin-text-subtle hover:text-blue-600 transition-colors"
      title="Send to email subscribers"
    >
      <Send size={14} />
    </button>
  );
}

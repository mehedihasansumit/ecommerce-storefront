"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/features/orders/types";

const STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
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
    if (newStatus === status) return;
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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as OrderStatus)}
          disabled={saving}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {saving && <p className="text-xs text-gray-400">Saving...</p>}
    </div>
  );
}

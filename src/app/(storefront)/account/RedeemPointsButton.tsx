"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POINTS_PER_BDT, MIN_REDEMPTION_POINTS } from "@/features/points/types";

interface RedeemPointsButtonProps {
  points: number;
}

export default function RedeemPointsButton({ points }: RedeemPointsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Redeem maximum possible in multiples of MIN_REDEMPTION_POINTS
  const redeemablePoints =
    Math.floor(points / MIN_REDEMPTION_POINTS) * MIN_REDEMPTION_POINTS;
  const discountValue = redeemablePoints / POINTS_PER_BDT;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: redeemablePoints }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Redemption failed");
        return;
      }
      setCouponCode(data.coupon.code as string);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!couponCode) return;
    await navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (couponCode) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500">Your coupon code:</p>
        <div className="flex items-center gap-2">
          <code
            className="text-sm font-mono font-semibold px-3 py-1.5 rounded-lg border border-dashed"
            style={{
              color: "var(--color-primary)",
              borderColor: "var(--color-primary)",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, white)",
            }}
          >
            {couponCode}
          </code>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-gray-400">Valid for 30 days · Single use</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-right">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleRedeem}
        disabled={loading || redeemablePoints === 0}
        className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {loading
          ? "Redeeming…"
          : `Redeem ${redeemablePoints} pts for ৳${discountValue}`}
      </button>
    </div>
  );
}

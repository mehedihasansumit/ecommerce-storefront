"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button, formatPrice } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";

interface RedeemPointsButtonProps {
  points: number;
  minRedemption: number;
  pointsPerBdt: number;
}

export default function RedeemPointsButton({
  points,
  minRedemption,
  pointsPerBdt,
}: RedeemPointsButtonProps) {
  const router = useRouter();
  const tr = useTranslations("redeemPoints");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Redeem maximum possible in multiples of minRedemption
  const redeemablePoints = Math.floor(points / minRedemption) * minRedemption;
  const discountValue = redeemablePoints / pointsPerBdt;

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
        setError(data.error ?? tr("redeemFailed"));
        return;
      }
      setCouponCode(data.coupon.code as string);
      router.refresh();
    } catch {
      setError(tr("genericError"));
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
        <p className="text-xs text-text-secondary">{tr("yourCode")}</p>
        <div className="flex items-center gap-2">
          <code
            className="text-sm font-mono font-semibold px-3 py-1.5 rounded-lg border border-dashed"
            style={{
              color: "var(--color-link)",
              borderColor: "var(--color-link)",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, var(--color-card-bg))",
            }}
          >
            {couponCode}
          </code>
          <Button variant="secondary" size="sm" onClick={handleCopy} aria-live="polite">
            {copied ? tr("copied") : tr("copy")}
          </Button>
        </div>
        <p className="text-xs text-text-secondary">{tr("validity")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 text-right">
      {error && <p className="text-xs text-error" role="alert">{error}</p>}
      <Button
        variant="brand"
        onClick={handleRedeem}
        loading={loading}
        disabled={redeemablePoints === 0}
      >
        {tr("redeem", {
          points: redeemablePoints,
          amount: formatPrice(discountValue, currency, locale),
        })}
      </Button>
    </div>
  );
}

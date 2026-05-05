"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Package, ChevronRight } from "lucide-react";
import { Alert, Button, Card, Field, Input, PageHeader } from "@/shared/components/ui";

type TrackResult = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

export default function TrackOrderPage() {
  const t = useTranslations("orderTrack");
  const tDetail = useTranslations("orderDetail");
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResults([]);

    const trimmedNumber = orderNumber.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedNumber && !trimmedPhone) {
      setError(t("invalidInput"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(trimmedNumber ? { orderNumber: trimmedNumber } : {}),
          ...(trimmedPhone ? { phone: `+88${trimmedPhone}` } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 404 ? t("notFound") : data.error || t("networkError"));
        return;
      }
      const orders: TrackResult[] = data.orders ?? [];
      if (orders.length === 0) {
        setError(t("notFound"));
        return;
      }
      if (orders.length === 1) {
        router.push(`/orders/${orders[0].orderId}`);
        return;
      }
      setResults(orders);
    } catch {
      setError(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader title={t("title")} description={t("description")} />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          <Field
            label={t("orderNumberLabel")}
            hint={t("orderNumberHint")}
          >
            <Input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder="ORD-XXXXXXXX"
              autoComplete="off"
              autoFocus
            />
          </Field>

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-text-tertiary">
            <span className="flex-1 h-px bg-border-subtle" />
            <span>{t("or")}</span>
            <span className="flex-1 h-px bg-border-subtle" />
          </div>

          <Field label={t("phoneLabel")} hint={t("phoneHint")}>
            <div
              className={`flex items-center border rounded-lg overflow-hidden transition-colors ${
                error
                  ? "border-red-400"
                  : "border-gray-300 focus-within:border-[var(--color-primary)] dark:border-gray-600"
              }`}
            >
              <span className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 select-none">
                +88
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="01XXXXXXXXX"
                className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                autoComplete="tel"
              />
            </div>
          </Field>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            fullWidth
            loading={submitting}
            leftIcon={<Search size={16} />}
          >
            {submitting ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Card>

      {results.length > 1 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary px-1">
            {t("resultsCount", { count: results.length })}
          </p>
          {results.map((o) => (
            <Link
              key={o.orderId}
              href={`/orders/${o.orderId}`}
              className="flex items-center gap-3 p-4 rounded-xl bg-bg border border-border-subtle hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)] hover:shadow-sm transition-all"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                }}
              >
                <Package size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-bold truncate"
                  style={{ color: "var(--color-primary)" }}
                >
                  {o.orderNumber}
                </p>
                <p className="text-[11px] text-text-tertiary">
                  {new Date(o.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · ৳"}
                  {o.total.toLocaleString()}
                </p>
              </div>
              <span
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                {tDetail(`status${o.status.charAt(0).toUpperCase() + o.status.slice(1)}` as never)}
              </span>
              <ChevronRight size={16} className="text-text-tertiary shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

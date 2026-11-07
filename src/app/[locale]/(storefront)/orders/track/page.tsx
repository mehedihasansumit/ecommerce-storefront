"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, Package, ChevronRight } from "lucide-react";
import { Alert, Button, Card, Field, Input, PageHeader, formatPrice } from "@/shared/components/ui";
import { useStoreCurrency } from "@/shared/hooks/useStoreCurrency";

// Mirrors TrackResultOrder in @/features/orders/tracking.
type TrackResult = {
  /** Set only when order number + phone matched; then the full order can open. */
  orderId: string | null;
  orderNumber: string;
  masked: boolean;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

export default function TrackOrderPage() {
  const t = useTranslations("orderTrack");
  const tDetail = useTranslations("orderDetail");
  const tc = useTranslations("common");
  const locale = useLocale();
  const currency = useStoreCurrency();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<TrackResult[]>([]);
  // What the shopper searched with; the verify step asks for the other one.
  const [searched, setSearched] = useState<{ orderNumber: string; phone: string }>({
    orderNumber: "",
    phone: "",
  });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResults([]);
    setOpenIndex(null);

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
          ...(trimmedPhone ? { phone: withCountryCode(trimmedPhone) } : {}),
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
      // Order number + phone matched: open the full order straight away.
      if (orders.length === 1 && orders[0].orderId) {
        router.push(`/orders/${orders[0].orderId}`);
        return;
      }
      setSearched({ orderNumber: trimmedNumber, phone: trimmedPhone });
      setResults(orders);
      if (orders.length === 1) setOpenIndex(0);
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

          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-text-secondary">
            <span className="flex-1 h-px bg-border-subtle" />
            <span>{t("or")}</span>
            <span className="flex-1 h-px bg-border-subtle" />
          </div>

          <Field label={t("phoneLabel")} hint={t("phoneHint")}>
            <Input
              type="tel"
              inputMode="numeric"
              prefix="+88"
              invalid={Boolean(error)}
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder={tc("phonePlaceholder")}
              autoComplete="tel-national"
            />
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

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary px-1">
            {t("resultsCount", { count: results.length })}
          </p>
          {results.map((o, i) => (
            <div
              key={`${o.orderNumber}-${o.createdAt}`}
              className="rounded-xl bg-bg border border-border-subtle overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                className="focus-ring w-full flex items-center gap-3 p-4 text-start hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)] transition-colors"
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
                    {" · "}
                    {formatPrice(o.total, currency, locale)}
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
                <ChevronRight
                  size={16}
                  className={`text-text-tertiary shrink-0 transition-transform ${openIndex === i ? "rotate-90" : ""}`}
                />
              </button>
              {openIndex === i && (
                <VerifyOrder
                  result={o}
                  searched={searched}
                  onVerified={(orderId) => router.push(`/orders/${orderId}`)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** The track API and checkout store phones as +88 followed by the 11-digit number. */
function withCountryCode(localDigits: string): string {
  return `+88${localDigits}`;
}

/**
 * Asks for the piece the shopper didn't search with (the full order number after
 * a phone search, the phone after an order-number search). When both match, the
 * server grants this browser the order pass and returns the id to open.
 */
function VerifyOrder({
  result,
  searched,
  onVerified,
}: {
  result: TrackResult;
  searched: { orderNumber: string; phone: string };
  onVerified: (orderId: string) => void;
}) {
  const t = useTranslations("orderTrack");
  const tc = useTranslations("common");
  const askNumber = result.masked; // searched by phone → need the order number
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const entered = value.trim();
    if (!entered) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          askNumber
            ? { orderNumber: entered, phone: withCountryCode(searched.phone) }
            : { orderNumber: result.orderNumber, phone: withCountryCode(entered) },
        ),
      });
      const data = await res.json().catch(() => ({}));
      const orderId: string | null | undefined = data.orders?.[0]?.orderId;
      if (!res.ok || !orderId) {
        setError(res.status === 404 || res.ok ? t("verifyMismatch") : t("networkError"));
        return;
      }
      onVerified(orderId);
    } catch {
      setError(t("networkError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={verify} className="border-t border-border-subtle p-4 space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      {askNumber ? (
        <Field label={t("verifyNumberLabel")} hint={t("verifyNumberHint")}>
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="ORD-XXXXXXXX"
            autoComplete="off"
            autoFocus
          />
        </Field>
      ) : (
        <Field label={t("verifyPhoneLabel")} hint={t("phoneHint")}>
          <Input
            type="tel"
            inputMode="numeric"
            prefix="+88"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder={tc("phonePlaceholder")}
            autoComplete="tel-national"
            autoFocus
          />
        </Field>
      )}
      <Button type="submit" variant="brand" fullWidth loading={submitting}>
        {t("verifySubmit")}
      </Button>
    </form>
  );
}

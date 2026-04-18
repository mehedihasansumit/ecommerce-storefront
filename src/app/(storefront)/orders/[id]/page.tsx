"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckCircle,
  Package,
  Loader2,
  ClipboardList,
  ThumbsUp,
  Box,
  Truck,
  PartyPopper,
  XCircle,
  Check,
  MapPin,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import type { IOrder, IStatusHistoryEntry } from "@/features/orders/types";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_FLOW = [
  "delivered",
  "shipped",
  "processing",
  "confirmed",
  "pending",
] as const;

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: ClipboardList,
  confirmed: ThumbsUp,
  processing: Box,
  shipped: Truck,
  delivered: PartyPopper,
  cancelled: XCircle,
};

type TFn = ReturnType<typeof useTranslations<"orderDetail">>;

function statusLabel(status: string, t: TFn): string {
  const map: Record<string, string> = {
    pending: t("statusPending"),
    confirmed: t("statusConfirmed"),
    processing: t("statusProcessing"),
    shipped: t("statusShipped"),
    delivered: t("statusDelivered"),
    cancelled: t("statusCancelled"),
  };
  return map[status] ?? status;
}

function statusDesc(status: string, t: TFn): string {
  const map: Record<string, string> = {
    pending: t("descPending"),
    confirmed: t("descConfirmed"),
    processing: t("descProcessing"),
    shipped: t("descShipped"),
    delivered: t("descDelivered"),
    cancelled: t("descCancelled"),
  };
  return map[status] ?? "";
}

function paymentStatusLabel(ps: string, t: TFn): string {
  const map: Record<string, string> = {
    pending: t("paymentPending"),
    paid: t("paymentPaid"),
    failed: t("paymentFailed"),
    refunded: t("paymentRefunded"),
  };
  return map[ps] ?? ps;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function StatusTimeline({ order, t }: { order: IOrder; t: TFn }) {
  const history = order.statusHistory ?? [];

  const historyMap = new Map<string, IStatusHistoryEntry>();
  for (const entry of history) {
    historyMap.set(entry.status, entry);
  }

  const currentIdx = STATUS_FLOW.indexOf(
    order.status as (typeof STATUS_FLOW)[number]
  );
  const relevantFlow =
    currentIdx >= 0 ? STATUS_FLOW.slice(currentIdx) : STATUS_FLOW;

  const historyStatuses = [...history].reverse().map((e) => e.status);
  const allStatuses = [
    ...new Set([...historyStatuses, ...relevantFlow]),
  ] as string[];

  const displayStatuses = allStatuses.length > 0 ? allStatuses : [order.status];
  const isCancelled = order.status === "cancelled";

  return (
    <div className="space-y-0">
      {displayStatuses.map((status, idx) => {
        const entry = historyMap.get(status);
        const isFirst = idx === 0;
        const isLast = idx === displayStatuses.length - 1;
        const Icon = STATUS_ICONS[status] ?? ClipboardList;
        const hasDate = !!entry;

        return (
          <div key={status} className="flex gap-0">
            {/* Left: icon + line */}
            <div className="flex flex-col items-center" style={{ width: 52 }}>
              <div
                className="relative flex-shrink-0 flex items-center justify-center rounded-full z-10"
                style={{
                  width: 44,
                  height: 44,
                  ...(isFirst && !isCancelled
                    ? {
                        background: "var(--color-primary)",
                        boxShadow:
                          "0 0 0 4px color-mix(in srgb, var(--color-primary) 20%, transparent)",
                      }
                    : isCancelled && isFirst
                    ? {
                        background: "#ef4444",
                        boxShadow: "0 0 0 4px rgba(239,68,68,0.15)",
                      }
                    : {
                        background: "var(--color-surface)",
                        border: "2px solid var(--color-border-subtle)",
                      }),
                }}
              >
                {isFirst && !isCancelled ? (
                  <Icon size={18} color="#fff" />
                ) : isCancelled && isFirst ? (
                  <XCircle size={18} color="#fff" />
                ) : hasDate ? (
                  <Check size={16} color="var(--color-primary)" strokeWidth={2.5} />
                ) : (
                  <Icon size={16} style={{ color: "var(--color-text-tertiary)" }} />
                )}
              </div>

              {!isLast && (
                <div
                  className="flex-1 my-0.5"
                  style={{
                    minHeight: 32,
                    width: 2,
                    background: hasDate
                      ? "color-mix(in srgb, var(--color-primary) 35%, var(--color-border-subtle))"
                      : "var(--color-border-subtle)",
                  }}
                />
              )}
            </div>

            {/* Right: content */}
            <div
              className="flex-1 min-w-0"
              style={{ paddingBottom: isLast ? 0 : 24, paddingLeft: 12 }}
            >
              <div
                className="rounded-xl p-4"
                style={
                  isFirst
                    ? {
                        background: isCancelled
                          ? "rgba(239,68,68,0.06)"
                          : "color-mix(in srgb, var(--color-primary) 7%, transparent)",
                        border: isCancelled
                          ? "1px solid rgba(239,68,68,0.15)"
                          : "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                      }
                    : { background: "transparent" }
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{
                        color: isFirst
                          ? isCancelled
                            ? "#ef4444"
                            : "var(--color-primary)"
                          : hasDate
                          ? "var(--color-text)"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {statusLabel(status, t)}
                    </p>
                    {isFirst && (
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{
                          color: isCancelled
                            ? "rgba(239,68,68,0.7)"
                            : "color-mix(in srgb, var(--color-primary) 70%, #6b7280)",
                        }}
                      >
                        {statusDesc(status, t)}
                      </p>
                    )}
                    {entry?.note && !isFirst && (
                      <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                        {entry.note}
                      </p>
                    )}
                  </div>

                  {entry && (
                    <time className="text-[11px] text-text-tertiary whitespace-nowrap shrink-0 mt-0.5 font-medium">
                      {new Date(entry.changedAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{
          background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
        }}
      >
        <Icon size={14} style={{ color: "var(--color-primary)" }} />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const t = useTranslations("orderDetail");
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ id }, sp] = await Promise.all([params, searchParams]);
      setConfirmed(sp.confirmed === "1");
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (!res.ok) setError(data.error || t("notFound"));
        else setOrder(data.order);
      } catch {
        setError(t("failedToLoad"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params, searchParams, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64 py-20">
        <Loader2 size={32} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary mb-4">{error || t("notFound")}</p>
        <Link
          href="/products"
          className="text-sm underline text-text-secondary hover:text-[var(--color-text)]"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === "cancelled";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Confirmation banner ── */}
      {confirmed && (
        <div
          className="rounded-2xl p-6 text-center mb-6"
          style={{
            background: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--color-primary)" }}
          >
            <CheckCircle size={28} color="#fff" />
          </div>
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            {t("orderPlaced")}
          </h1>
          <p className="text-sm text-text-secondary">
            {t("orderPlacedDesc", { phone: order.shippingAddress.phone })}
          </p>
        </div>
      )}

      {/* ── Page header ── */}
      {!confirmed && (
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/orders"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg border border-border-subtle hover:border-primary/40 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} className="text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text)]">{t("title")}</h1>
            <p className="text-xs text-text-tertiary">{order.orderNumber}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">

        {/* ── Order meta card ── */}
        <div className="bg-bg rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-0.5">
                {t("orderNumber")}
              </p>
              <p className="text-lg font-bold text-[var(--color-text)]">
                {order.orderNumber}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {new Date(order.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              className={isCancelled ? "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400" : ""}
            style={
                !isCancelled
                  ? {
                      background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      color: "var(--color-primary)",
                    }
                  : undefined
              }
            >
              {statusLabel(order.status, t)}
            </span>
          </div>
        </div>

        {/* ── Status timeline card ── */}
        <div className="bg-bg rounded-2xl border border-border-subtle shadow-sm p-5">
          <SectionLabel icon={Truck} label={t("orderTracking")} />
          <StatusTimeline order={order} t={t} />
        </div>

        {/* ── Items card ── */}
        <div className="bg-bg rounded-2xl border border-border-subtle shadow-sm p-5">
          <SectionLabel icon={Package} label={t("items")} />
          <div className="space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0">
                  <Package size={18} className="text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-text)] leading-tight">
                    {item.productName}
                  </p>
                  {Object.entries(item.variantSelections || {}).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-block text-[11px] text-text-secondary bg-surface rounded-md px-2 py-0.5 mr-1 mt-1"
                    >
                      {k}: {v}
                    </span>
                  ))}
                  <p className="text-xs text-text-tertiary mt-1">
                    {t("qty", { count: item.quantity })}
                  </p>
                  {item.productSlug && (
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium hover:underline"
                      style={{ color: "var(--color-primary)" }}
                    >
                      View Product →
                    </Link>
                  )}
                </div>
                <p className="font-bold text-sm text-[var(--color-text)] shrink-0">
                  ৳{item.totalPrice.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-5 pt-4 border-t border-border-subtle space-y-2">
            <div className="flex justify-between text-sm text-text-secondary">
              <span>{t("subtotal")}</span>
              <span>৳{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-text-secondary">
              <span>{t("shipping")}</span>
              <span className="text-green-600 dark:text-green-400 font-medium">{t("shippingFree")}</span>
            </div>
            <div
              className="flex justify-between text-base font-bold pt-2 border-t border-border-subtle"
              style={{ color: "var(--color-primary)" }}
            >
              <span>{t("total")}</span>
              <span>৳{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery + Payment ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Delivery address */}
          <div className="bg-bg rounded-2xl border border-border-subtle shadow-sm p-5">
            <SectionLabel icon={MapPin} label={t("deliveryAddress")} />
            <div className="space-y-0.5 text-sm">
              <p className="font-semibold text-[var(--color-text)]">
                {order.shippingAddress.name}
              </p>
              <p className="text-text-secondary">{order.shippingAddress.phone}</p>
              <p className="text-text-secondary mt-1">{order.shippingAddress.street}</p>
              <p className="text-text-secondary">
                {order.shippingAddress.city}
                {order.shippingAddress.postalCode
                  ? `, ${order.shippingAddress.postalCode}`
                  : ""}
              </p>
              {order.shippingAddress.country && (
                <p className="text-text-secondary">{order.shippingAddress.country}</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-bg rounded-2xl border border-border-subtle shadow-sm p-5">
            <SectionLabel icon={CreditCard} label={t("payment")} />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{t("paymentMethod")}</span>
                <span className="font-semibold text-[var(--color-text)]">
                  {order.paymentMethod === "cod"
                    ? t("cod")
                    : order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{t("paymentStatus")}</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                      : order.paymentStatus === "failed"
                      ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  {paymentStatusLabel(order.paymentStatus, t)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="pt-2 pb-4 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {t("continueShopping")}
          </Link>
        </div>

      </div>
    </div>
  );
}

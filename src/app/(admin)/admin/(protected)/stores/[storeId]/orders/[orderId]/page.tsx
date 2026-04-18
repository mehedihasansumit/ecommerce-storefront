import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  StickyNote,
  ShieldAlert,
  Package,
  History,
  Phone,
  Mail,
  Tag,
  Truck,
} from "lucide-react";
import { OrderService } from "@/features/orders/service";
import { OrderStatusUpdater } from "./OrderStatusUpdater";
import type { OrderStatus, PaymentStatus } from "@/features/orders/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped:    "bg-indigo-100 text-indigo-700",
  delivered:  "bg-green-100 text-green-700",
  cancelled:  "bg-red-100 text-red-700",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  pending:  "bg-yellow-100 text-yellow-700",
  paid:     "bg-green-100 text-green-700",
  failed:   "bg-red-100 text-red-700",
  refunded: "bg-admin-chip text-admin-text-secondary",
};

const HISTORY_DOT: Record<OrderStatus, string> = {
  pending:    "bg-yellow-400",
  confirmed:  "bg-blue-400",
  processing: "bg-purple-400",
  shipped:    "bg-indigo-400",
  delivered:  "bg-green-500",
  cancelled:  "bg-red-400",
};

function SectionCard({
  icon: Icon,
  title,
  children,
  headerRight,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div className="bg-admin-surface rounded-xl border border-admin-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-admin-border">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-admin-text-subtle" />
          <h2 className="font-semibold text-sm text-admin-text-secondary">{title}</h2>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>;
}) {
  const { storeId, orderId } = await params;
  const order = await OrderService.getById(storeId, orderId);
  if (!order) notFound();

  const sameIpOrders = order.clientIp
    ? await OrderService.getByIp(storeId, order.clientIp, order._id)
    : [];

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/admin/stores/${storeId}/orders`}
          className="inline-flex items-center gap-1.5 text-sm text-admin-text-muted hover:text-gray-800 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono tracking-tight text-gray-900">
                {order.orderNumber}
              </h1>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${STATUS_STYLES[order.status]}`}
              >
                {order.status}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${PAYMENT_STYLES[order.paymentStatus]}`}
              >
                {order.paymentStatus}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-admin-text-muted flex-wrap">
              <span>
                {new Date(order.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-gray-300">·</span>
              <span>{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-800">
                ৳{order.total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status updater (full width) ── */}
      <OrderStatusUpdater
        orderId={order._id}
        storeId={storeId}
        currentStatus={order.status}
      />

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── Left: Items + History + Notes + IP ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Items */}
          <SectionCard
            icon={Package}
            title="Order Items"
            headerRight={
              <span className="text-xs text-admin-text-subtle font-medium">
                {order.items.length} line{order.items.length !== 1 ? "s" : ""}
              </span>
            }
          >
            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="px-5 py-3.5 flex items-start gap-4">
                  {/* Qty badge */}
                  <span className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-admin-chip text-admin-text-secondary text-xs font-bold flex items-center justify-center">
                    {item.quantity}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {item.productName}
                    </p>
                    {Object.keys(item.variantSelections || {}).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {Object.entries(item.variantSelections).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-xs bg-admin-chip text-admin-text-secondary px-2 py-0.5 rounded-md"
                          >
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      ৳{item.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-admin-text-subtle mt-0.5">
                      ৳{item.unitPrice.toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-5 py-3.5 bg-admin-surface-raised border-t border-admin-border space-y-1.5 text-sm">
              <div className="flex justify-between text-admin-text-muted">
                <span>Subtotal</span>
                <span>৳{order.subtotal.toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </span>
                  <span>−৳{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-admin-text-muted">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  Shipping
                </span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    `৳${order.shippingCost.toLocaleString()}`
                  )}
                </span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-admin-text-muted">
                  <span>Tax</span>
                  <span>৳{order.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-admin-border text-gray-900">
                <span>Total</span>
                <span>৳{order.total.toLocaleString()}</span>
              </div>
            </div>
          </SectionCard>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <SectionCard icon={History} title="Status History">
              <div className="px-5 py-4">
                <ol className="relative border-l border-admin-border space-y-4 ml-2">
                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <li key={idx} className="ml-4">
                      <span
                        className={`absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white ${
                          HISTORY_DOT[entry.status] ?? "bg-gray-400"
                        }`}
                      />
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium capitalize text-gray-800">
                            {entry.status}
                          </p>
                          {entry.note && (
                            <p className="text-xs text-admin-text-muted mt-0.5">{entry.note}</p>
                          )}
                        </div>
                        <time className="text-xs text-admin-text-subtle shrink-0">
                          {new Date(entry.changedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </SectionCard>
          )}

          {/* Notes */}
          {order.notes && (
            <SectionCard icon={StickyNote} title="Notes">
              <p className="px-5 py-4 text-sm text-admin-text-secondary leading-relaxed">
                {order.notes}
              </p>
            </SectionCard>
          )}

          {/* IP Tracking */}
          <SectionCard
            icon={ShieldAlert}
            title="IP Tracking"
            headerRight={
              order.clientIp ? (
                <code className="text-xs font-mono bg-admin-chip text-admin-text-secondary px-2 py-0.5 rounded">
                  {order.clientIp}
                </code>
              ) : undefined
            }
          >
            <div className="px-5 py-4">
              {order.clientIp ? (
                sameIpOrders.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {sameIpOrders.length} other order{sameIpOrders.length > 1 ? "s" : ""} from this IP
                      </span>
                    </div>
                    <div className="rounded-lg border border-red-100 overflow-hidden">
                      <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                        Related orders — {order.clientIp}
                      </div>
                      <div className="divide-y divide-gray-100">
                        {sameIpOrders.map((o) => (
                          <Link
                            key={o._id}
                            href={`/admin/stores/${storeId}/orders/${o._id}`}
                            className="flex items-center justify-between px-4 py-3 text-sm hover:bg-admin-surface-hover transition-colors group"
                          >
                            <div>
                              <span className="font-mono font-semibold text-gray-800 group-hover:text-gray-900">
                                {o.orderNumber}
                              </span>
                              <span className="ml-2 text-admin-text-subtle text-xs">
                                {o.shippingAddress.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-admin-text-secondary font-medium">
                                ৳{o.total.toLocaleString()}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
                                  STATUS_STYLES[o.status] ?? "bg-admin-chip text-admin-text-secondary"
                                }`}
                              >
                                {o.status}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-admin-text-muted">
                    No other orders from this IP address.
                  </p>
                )
              ) : (
                <p className="text-sm text-admin-text-subtle">No IP recorded for this order.</p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Right: Customer + Address + Payment ── */}
        <div className="space-y-5">

          {/* Customer */}
          <SectionCard icon={User} title="Customer">
            <div className="px-5 py-4 space-y-3">
              <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-admin-text-subtle shrink-0" />
                  <span>{order.shippingAddress.phone}</span>
                </div>
                {order.guestEmail && (
                  <div className="flex items-center gap-2 text-sm text-admin-text-secondary">
                    <Mail className="w-3.5 h-3.5 text-admin-text-subtle shrink-0" />
                    <span className="truncate">{order.guestEmail}</span>
                  </div>
                )}
              </div>
              {!order.userId && (
                <span className="inline-block text-xs bg-admin-chip text-admin-text-muted px-2 py-0.5 rounded-full">
                  Guest
                </span>
              )}
            </div>
          </SectionCard>

          {/* Delivery Address */}
          <SectionCard icon={MapPin} title="Delivery Address">
            <div className="px-5 py-4">
              <address className="not-italic text-sm text-admin-text-secondary space-y-0.5 leading-relaxed">
                <p className="font-medium">{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                  {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
                </p>
                <p className="text-admin-text-muted">{order.shippingAddress.country}</p>
              </address>
            </div>
          </SectionCard>

          {/* Payment */}
          <SectionCard icon={CreditCard} title="Payment">
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-admin-text-secondary capitalize">
                  {order.paymentMethod === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod}
                </span>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${PAYMENT_STYLES[order.paymentStatus]}`}
                >
                  {order.paymentStatus}
                </span>
              </div>

              <div className="rounded-lg bg-admin-surface-raised border border-admin-border px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-admin-text-muted">
                  <span>Order total</span>
                  <span className="font-semibold text-gray-800">৳{order.total.toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−৳{order.discount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {order.paymentIntentId && (
                <p className="text-xs text-admin-text-subtle font-mono truncate">
                  {order.paymentIntentId}
                </p>
              )}

              <Link
                href={`/admin/stores/${storeId}/payments`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Manage payment →
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

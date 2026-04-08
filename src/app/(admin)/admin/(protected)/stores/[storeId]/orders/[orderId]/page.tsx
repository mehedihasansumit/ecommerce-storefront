import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderService } from "@/features/orders/service";
import { OrderStatusUpdater } from "./OrderStatusUpdater";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; orderId: string }>;
}) {
  const { storeId, orderId } = await params;
  const order = await OrderService.getById(storeId, orderId);
  if (!order) notFound();

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link
            href={`/admin/stores/${storeId}/orders`}
            className="text-sm text-gray-500 hover:text-gray-800 mb-1 inline-block"
          >
            ← Orders
          </Link>
          <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date(order.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Status updater */}
        <OrderStatusUpdater
          orderId={order._id}
          storeId={storeId}
          currentStatus={order.status}
        />
      </div>

      <div className="space-y-5">
        {/* Items */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
              Items
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="px-5 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.productName}</p>
                  {Object.entries(item.variantSelections || {}).map(
                    ([k, v]) => (
                      <p key={k} className="text-xs text-gray-500">
                        {k}: {v}
                      </p>
                    )
                  )}
                </div>
                <div className="text-right text-sm shrink-0">
                  <p className="text-gray-500">
                    ৳{item.unitPrice.toLocaleString()} × {item.quantity}
                  </p>
                  <p className="font-semibold">
                    ৳{item.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>৳{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{order.shippingCost === 0 ? "Free" : `৳${order.shippingCost}`}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-100 mt-1">
              <span>Total</span>
              <span>৳{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
            Customer
          </h2>
          <div className="text-sm space-y-1">
            <p className="font-medium">{order.shippingAddress.name}</p>
            <p className="text-gray-600">{order.shippingAddress.phone}</p>
            {order.guestEmail && (
              <p className="text-gray-600">{order.guestEmail}</p>
            )}
          </div>
        </div>

        {/* Shipping address */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
            Delivery Address
          </h2>
          <div className="text-sm text-gray-700 space-y-0.5">
            <p>{order.shippingAddress.street}</p>
            <p>
              {order.shippingAddress.city}
              {order.shippingAddress.postalCode
                ? `, ${order.shippingAddress.postalCode}`
                : ""}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-3">
            Payment
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 capitalize">
              {order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                order.paymentStatus === "paid"
                  ? "bg-green-100 text-green-800"
                  : order.paymentStatus === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-2">
              Notes
            </h2>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

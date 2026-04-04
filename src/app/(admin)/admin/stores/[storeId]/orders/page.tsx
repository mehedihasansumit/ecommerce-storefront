import Link from "next/link";
import { OrderService } from "@/features/orders/service";
import type { OrderStatus } from "@/features/orders/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

const PAYMENT_STYLES: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  paid:     "bg-green-100 text-green-800",
  failed:   "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export default async function StoreOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { storeId } = await params;
  const { status } = await searchParams;

  const orders = await OrderService.getByStore(storeId, {
    status: status || undefined,
  });

  const statuses: OrderStatus[] = [
    "pending","confirmed","processing","shipped","delivered","cancelled",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Link
          href={`/admin/stores/${storeId}/orders`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            !status
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/stores/${storeId}/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
              status === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No orders{status ? ` with status "${status}"` : ""} yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Order
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Items
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Payment
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">
                        {order.shippingAddress.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.shippingAddress.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      ৳{order.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          PAYMENT_STYLES[order.paymentStatus] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/stores/${storeId}/orders/${order._id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

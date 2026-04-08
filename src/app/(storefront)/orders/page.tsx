import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { getStoreId } from "@/shared/lib/tenant";
import { OrderService } from "@/features/orders/service";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("myOrders") };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default async function OrdersPage() {
  const t = await getTranslations("orders");

  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    redirect("/account/login");
  }

  const customerPayload = payload as JwtCustomerPayload;
  const storeId = await getStoreId();
  if (!storeId) redirect("/");

  const orders = await OrderService.getByUser(storeId, customerPayload.userId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("myOrders")}</h1>
        <Link
          href="/account"
          className="text-sm"
          style={{ color: "var(--color-primary)" }}
        >
          ← My Account
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t("noOrders")}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2 text-white font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border border-gray-200 rounded-lg p-5 bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {t("orderNumber")}
                    {order.orderNumber}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t("date")}:{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("items", { count: order.items.length })}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="font-semibold">
                    ৳{order.total.toLocaleString()}
                  </p>
                  <Link
                    href={`/orders/${order._id}`}
                    className="text-sm font-medium"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {t("viewOrder")} →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

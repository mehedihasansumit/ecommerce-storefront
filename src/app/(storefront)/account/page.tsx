import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import { getCustomerToken } from "@/shared/lib/auth";
import { getStoreId } from "@/shared/lib/tenant";
import { AuthRepository } from "@/features/auth/repository";
import { OrderService } from "@/features/orders/service";
import type { JwtCustomerPayload } from "@/features/auth/types";
import LogoutButton from "./LogoutButton";
import RedeemPointsButton from "./RedeemPointsButton";
import { PointService } from "@/features/points/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("myAccount") };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AccountPage() {
  const t = await getTranslations("account");

  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    redirect("/account/login");
  }

  const customerPayload = payload as JwtCustomerPayload;
  const user = await AuthRepository.findUserById(customerPayload.userId);
  if (!user) redirect("/account/login");

  const storeId = await getStoreId();
  const [orders, pointsConfig] = await Promise.all([
    user.phone && storeId
      ? OrderService.getByPhone(storeId, user.phone)
      : Promise.resolve([]),
    storeId ? PointService.getConfig(storeId) : Promise.resolve(null),
  ]);
  const pointsEnabled = pointsConfig?.enabled ?? true;
  const pointsPerBdt = pointsConfig?.pointsPerBdt ?? 10;
  const minRedemption = pointsConfig?.minRedemptionPoints ?? 100;
  const pointsPerReview = pointsConfig?.pointsPerReview ?? 10;

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const recentOrders = orders.slice(0, 3);

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const initials = getInitials(user.name);
  const defaultAddr =
    user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Profile header card */}
      <div className="bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 select-none"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">{user.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{user.email || user.phone}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t("memberSince")}: {memberSince}</p>
            </div>
          </div>
          <LogoutButton label={t("logout")} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("email")}</p>
            <p className="font-medium truncate">{user.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("phone")}</p>
            <p className="font-medium">{user.phone || t("notProvided")}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("memberSince")}</p>
            <p className="font-medium">{memberSince}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("totalOrders")}</p>
            <p className="text-2xl font-semibold" style={{ color: "var(--color-primary)" }}>
              {orders.length}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("totalSpent")}</p>
            <p className="text-2xl font-semibold" style={{ color: "var(--color-primary)" }}>
              ৳{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Points & Rewards */}
      {pointsEnabled && (
        <div className="bg-white border border-gray-100 shadow-xs rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Points &amp; Rewards</h2>
            <span className="text-xs text-gray-400">{pointsPerBdt} pts = ৳1</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                {user.points ?? 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Available points</p>
            </div>
            {(user.points ?? 0) >= minRedemption && (
              <RedeemPointsButton
                points={user.points ?? 0}
                minRedemption={minRedemption}
                pointsPerBdt={pointsPerBdt}
              />
            )}
          </div>
          {(user.points ?? 0) < minRedemption && (
            <p className="text-xs text-gray-400 mt-3">
              {minRedemption - (user.points ?? 0)} more points needed to redeem &middot; Write a product review to earn {pointsPerReview} pts
            </p>
          )}
        </div>
      )}

      {/* Section navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/orders"
          className="flex items-center justify-between bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-5 hover:shadow-[var(--shadow-sm)] transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, white)" }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t("viewOrders")}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/account/addresses"
          className="flex items-center justify-between bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-5 hover:shadow-[var(--shadow-sm)] transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, white)" }}
            >
              <MapPin className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t("manageAddresses")}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user.addresses?.length ?? 0} saved
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link
              href="/orders"
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                href={`/orders/${order._id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">#{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-md ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-sm font-semibold text-gray-900">
                    ৳{order.total.toLocaleString()}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Default address */}
      {defaultAddr && (
        <div className="bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">{t("defaultAddress")}</h2>
            <Link
              href="/account/addresses"
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              {t("manageAddresses")} →
            </Link>
          </div>
          <div className="text-sm text-gray-600 space-y-0.5">
            {defaultAddr.label && (
              <p className="font-medium text-gray-800">{defaultAddr.label}</p>
            )}
            <p>{defaultAddr.street}</p>
            <p>
              {defaultAddr.city}
              {defaultAddr.postalCode ? `, ${defaultAddr.postalCode}` : ""}
            </p>
            {defaultAddr.state && <p>{defaultAddr.state}</p>}
            <p>{defaultAddr.country}</p>
          </div>
        </div>
      )}
    </div>
  );
}

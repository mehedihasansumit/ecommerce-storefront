import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShoppingBag, MapPin, ChevronRight, Star, Gift } from "lucide-react";
import { getCustomerToken } from "@/shared/lib/auth";
import { getStoreId } from "@/shared/lib/tenant";
import { AuthRepository } from "@/features/auth/repository";
import { OrderService } from "@/features/orders/service";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { Card, Badge, Price } from "@/shared/components/ui";
import LogoutButton from "./LogoutButton";
import RedeemPointsButton from "./RedeemPointsButton";
import { PointService } from "@/features/points/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("myAccount") };
}

const STATUS_BADGE: Record<string, { tone: "warning" | "neutral" | "success" | "danger"; label: string }> = {
  pending:    { tone: "warning", label: "Pending" },
  confirmed:  { tone: "neutral", label: "Confirmed" },
  processing: { tone: "neutral", label: "Processing" },
  shipped:    { tone: "neutral", label: "Shipped" },
  delivered:  { tone: "success", label: "Delivered" },
  cancelled:  { tone: "danger",  label: "Cancelled" },
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

      {/* Profile header */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 select-none"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold leading-tight">{user.name}</h1>
              <p className="text-sm text-text-secondary mt-0.5 truncate max-w-50 sm:max-w-none">{user.email || user.phone}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{t("memberSince")}: {memberSince}</p>
            </div>
          </div>
          <LogoutButton label={t("logout")} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-subtle text-sm">
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t("email")}</p>
            <p className="font-medium truncate">{user.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t("phone")}</p>
            <p className="font-medium">{user.phone || t("notProvided")}</p>
          </div>
          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t("memberSince")}</p>
            <p className="font-medium">{memberSince}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg px-4 py-3">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t("totalOrders")}</p>
            <p className="text-2xl font-bold" style={{ color: "var(--color-secondary)" }}>
              {orders.length}
            </p>
          </div>
          <div className="rounded-lg bg-surface px-4 py-3">
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">{t("totalSpent")}</p>
            <Price amount={totalSpent} size="lg" className="mt-0.5" />
          </div>
        </div>
      </Card>

      {/* Points & Rewards */}
      {pointsEnabled && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
              >
                <Gift className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 className="font-semibold text-[var(--color-text)]">Points &amp; Rewards</h2>
            </div>
            <span className="text-xs text-text-tertiary bg-surface px-2 py-1 rounded-md">{pointsPerBdt} pts = ৳1</span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
                {(user.points ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-text-tertiary mt-1">Available points</p>
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
            <div className="mt-3 p-3 rounded-lg bg-surface border border-border-subtle">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <p className="text-xs text-text-secondary">
                  {minRedemption - (user.points ?? 0)} more points needed to redeem &middot; Write a review to earn {pointsPerReview} pts
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/orders"
          className="flex items-center justify-between bg-bg border border-border-subtle rounded-lg p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)] text-sm">{t("viewOrders")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>

        <Link
          href="/account/addresses"
          className="flex items-center justify-between bg-bg border border-border-subtle rounded-lg p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
            >
              <MapPin className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="font-medium text-[var(--color-text)] text-sm">{t("manageAddresses")}</p>
              <p className="text-xs text-text-tertiary mt-0.5">
                {user.addresses?.length ?? 0} saved
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>

      {/* Recent orders */}
      {recentOrders.length > 0 && (
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <h2 className="font-semibold text-[var(--color-text)] text-sm">Recent Orders</h2>
            <Link
              href="/orders"
              className="text-xs font-medium"
              style={{ color: "var(--color-primary)" }}
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {recentOrders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? { tone: "neutral" as const, label: order.status };
              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-surface dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">#{order.orderNumber}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 ml-3">
                    <Badge tone={badge.tone} size="sm">{badge.label}</Badge>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      <Price amount={order.total} />
                    </p>
                    <ChevronRight className="w-4 h-4 text-text-tertiary hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Default address */}
      {defaultAddr && (
        <Card padding="lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)" }}
              >
                <MapPin className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              </div>
              <h2 className="font-semibold text-[var(--color-text)] text-sm">{t("defaultAddress")}</h2>
            </div>
            <Link
              href="/account/addresses"
              className="text-xs font-medium shrink-0"
              style={{ color: "var(--color-primary)" }}
            >
              {t("manageAddresses")} →
            </Link>
          </div>
          <div className="text-sm text-gray-600 space-y-0.5 ml-10">
            {defaultAddr.label && (
              <p className="font-semibold text-gray-800">{defaultAddr.label}</p>
            )}
            <p>{defaultAddr.street}</p>
            <p>
              {defaultAddr.city}
              {defaultAddr.postalCode ? `, ${defaultAddr.postalCode}` : ""}
            </p>
            {defaultAddr.state && <p>{defaultAddr.state}</p>}
            <p>{defaultAddr.country}</p>
          </div>
        </Card>
      )}
    </div>
  );
}

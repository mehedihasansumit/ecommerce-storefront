import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";
import LogoutButton from "./LogoutButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("myAccount") };
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

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t("myAccount")}</h1>
        <LogoutButton label={t("logout")} />
      </div>

      <div className="bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-8 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">
          {t("welcome", { name: user.name })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t("email")}</p>
            <p className="font-medium">{user.email}</p>
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
      </div>

      {/* Default address summary */}
      {user.addresses && user.addresses.length > 0 && (
        <div className="mt-6 bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-8">
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            {t("defaultAddress")}
          </h2>
          {(() => {
            const defaultAddr =
              user.addresses.find((a) => a.isDefault) || user.addresses[0];
            return (
              <div className="text-sm text-gray-600 space-y-0.5">
                {defaultAddr.label && (
                  <p className="font-medium text-gray-800">
                    {defaultAddr.label}
                  </p>
                )}
                <p>{defaultAddr.street}</p>
                <p>
                  {defaultAddr.city}
                  {defaultAddr.postalCode
                    ? `, ${defaultAddr.postalCode}`
                    : ""}
                </p>
                {defaultAddr.state && <p>{defaultAddr.state}</p>}
                <p>{defaultAddr.country}</p>
              </div>
            );
          })()}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="inline-block px-6 py-2 text-white font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {t("viewOrders")}
        </Link>
        <Link
          href="/account/addresses"
          className="inline-block px-6 py-2 font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          style={{
            borderRadius: "var(--border-radius)",
          }}
        >
          {t("manageAddresses")}
        </Link>
      </div>
    </div>
  );
}

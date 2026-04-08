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
        <h1 className="text-3xl font-bold">{t("myAccount")}</h1>
        <LogoutButton label={t("logout")} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">
          {t("welcome", { name: user.name })}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">{t("email")}</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("phone")}</p>
            <p className="font-medium">{user.phone || t("notProvided")}</p>
          </div>
          <div>
            <p className="text-gray-500">{t("memberSince")}</p>
            <p className="font-medium">{memberSince}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
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
      </div>
    </div>
  );
}

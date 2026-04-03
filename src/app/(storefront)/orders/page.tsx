import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("myOrders") };
}

export default async function OrdersPage() {
  const t = await getTranslations("orders");
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("myOrders")}</h1>
      <p className="text-gray-500">{t("pleaseLogin")}</p>
    </div>
  );
}

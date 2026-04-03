import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("checkout") };
}

export default async function CheckoutPage() {
  const t = await getTranslations("checkout");
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("checkout")}</h1>
      <p className="text-gray-500">{t("notImplemented")}</p>
    </div>
  );
}

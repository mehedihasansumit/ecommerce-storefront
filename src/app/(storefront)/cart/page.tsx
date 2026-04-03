import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("yourCart") };
}

export default async function CartPage() {
  const t = await getTranslations("cart");
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("yourCart")}</h1>
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">{t("empty")}</p>
        <a
          href="/products"
          className="inline-block px-6 py-2 text-white font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {t("continueShopping")}
        </a>
      </div>
    </div>
  );
}

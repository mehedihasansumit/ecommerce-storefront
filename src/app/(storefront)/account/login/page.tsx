import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("login") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8 text-center">{t("login")}</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("email")}</label>
          <input
            type="email"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("password")}</label>
          <input
            type="password"
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
            style={{ borderRadius: "var(--border-radius)" }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 text-white font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          {t("login")}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        {t("noAccount")}{" "}
        <Link
          href="/account/register"
          className="font-medium"
          style={{ color: "var(--color-primary)" }}
        >
          {t("register")}
        </Link>
      </p>
    </div>
  );
}

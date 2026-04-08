"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";
import { useTransition } from "react";

const languageNames: Record<string, string> = {
  en: "English",
  bn: "বাংলা",
};

export function LanguageSwitcher() {
  const tenant = useTenant();
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Only show if tenant has more than one language
  if (!tenant || !tenant.supportedLanguages || tenant.supportedLanguages.length <= 1) {
    return null;
  }

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Set the cookie via API call
      fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      }).then(() => {
        // Refresh the page to apply the new locale
        router.refresh();
      });
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tenant.supportedLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
          disabled={isPending}
          className={`px-2.5 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
            locale === lang
              ? "bg-primary text-white"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
          } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {languageNames[lang] || lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

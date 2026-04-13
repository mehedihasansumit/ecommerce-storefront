"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";

const languageNames: Record<string, string> = {
  en: "EN",
  bn: "বাং",
};

export function LanguageSwitcher() {
  const tenant = useTenant();
  const locale = useLocale();
  const router = useRouter();

  if (!tenant || !tenant.supportedLanguages || tenant.supportedLanguages.length <= 1) {
    return null;
  }

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg overflow-hidden border border-white/15 text-xs font-semibold">
      {tenant.supportedLanguages.map((lang) => {
        const isActive = locale === lang;
        return (
          <button
            key={lang}
            onClick={() => handleLanguageChange(lang)}
            className={`px-2.5 py-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-white/20 opacity-100"
                : "opacity-50 hover:opacity-80 hover:bg-white/10"
            }`}
          >
            {languageNames[lang] || lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

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

  // Locale cookie is set by /api/locale (single place that owns it).
  const handleLanguageChange = async (newLocale: string) => {
    if (newLocale === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {});
    router.refresh();
  };

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg overflow-hidden border border-current/20 text-xs font-semibold">
      {tenant.supportedLanguages.map((lang) => {
        const isActive = locale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            aria-pressed={isActive}
            lang={lang}
            className={`focus-ring-inset inline-flex min-h-10 min-w-10 items-center justify-center px-2.5 transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? // ≤359px: show only the language you can switch TO (one 40px button)
                  "bg-current/15 opacity-100 max-[359px]:hidden"
                : "opacity-75 hover:opacity-100 hover:bg-current/10"
            }`}
          >
            {languageNames[lang] || lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

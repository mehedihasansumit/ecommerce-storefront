"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";

const languageNames: Record<string, string> = {
  en: "EN",
  bn: "বাং",
};

/** Same cookie /api/locale sets, written here so a switch costs one request. */
function saveLocaleAndReload(locale: string) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

export function LanguageSwitcher() {
  const tenant = useTenant();
  const locale = useLocale();
  // The pressed button flips on click; the page follows when the reload lands.
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);
  const shownLocale = pendingLocale ?? locale;

  if (!tenant || !tenant.supportedLanguages || tenant.supportedLanguages.length <= 1) {
    return null;
  }

  // A full reload rather than router.refresh(): in production builds Next 16's
  // refresh can fetch the new payload and never commit it on streamed pages
  // (vercel/next.js#99028), leaving the old language on screen until the next
  // pointer move. The browser keeps the current page painted until the new one
  // is ready, so the reload does not flash.
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === shownLocale) return;
    setPendingLocale(newLocale);
    saveLocaleAndReload(newLocale);
  };

  return (
    <div
      aria-busy={pendingLocale ? true : undefined}
      className="flex shrink-0 items-center gap-0.5 rounded-lg overflow-hidden border border-current/20 text-xs font-semibold"
    >
      {tenant.supportedLanguages.map((lang) => {
        const isActive = shownLocale === lang;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => handleLanguageChange(lang)}
            aria-pressed={isActive}
            lang={lang}
            className={`focus-ring-inset inline-flex min-h-10 min-w-10 items-center justify-center px-2.5 transition-colors whitespace-nowrap ${pendingLocale ? "cursor-progress" : "cursor-pointer"} ${
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

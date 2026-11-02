"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useTenant } from "@/shared/hooks/useTenant";
import { getPathname, usePathname } from "@/i18n/navigation";

const languageNames: Record<string, string> = {
  en: "EN",
  bn: "বাং",
};

/**
 * Each language has its own URL (ADR 0004): switching goes from
 * /products/x to /bn/products/x and back. No cookie, no auto-redirect.
 */
export function LanguageSwitcher() {
  const tenant = useTenant();
  const locale = useLocale();
  // Path without the /bn prefix; search params (filters, ?Size=M) carry over.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The pressed button flips on click; the page follows when the new one lands.
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);
  const shownLocale = pendingLocale ?? locale;

  if (!tenant || !tenant.supportedLanguages || tenant.supportedLanguages.length <= 1) {
    return null;
  }

  // A full page load rather than a client navigation: the root layout (html
  // lang, fonts, translation messages) sits above [locale] and only renders
  // fresh on a document request. The browser keeps the current page painted
  // until the new one is ready, so it does not flash.
  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === shownLocale) return;
    setPendingLocale(newLocale);
    const query = searchParams.toString();
    const target = getPathname({ href: pathname, locale: newLocale });
    window.location.assign(query ? `${target}?${query}` : target);
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

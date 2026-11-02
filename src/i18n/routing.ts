import { defineRouting } from "next-intl/routing";

/**
 * Storefront language lives in the URL (ADR 0004): English unprefixed,
 * Bangla under /bn. No cookie or Accept-Language detection, because Googlebot
 * sends neither and must see every language at its own URL. hreflang is
 * emitted per page by seo.ts (only where Bangla content exists), so next-intl's
 * blanket Link header is off.
 */
export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];

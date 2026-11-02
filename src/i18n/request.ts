import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ requestLocale }) => {
  // Storefront: the proxy resolved the locale from the URL (/bn/… or none).
  // Admin and API routes skip i18n routing, so they fall back to the old
  // NEXT_LOCALE cookie, then English.
  let locale = await requestLocale;
  if (!locale) {
    const cookieStore = await cookies();
    locale = cookieStore.get("NEXT_LOCALE")?.value;
  }
  if (!hasLocale(routing.locales, locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

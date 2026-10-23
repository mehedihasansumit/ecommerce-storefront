import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getTenant, isAdminSurface } from "@/shared/lib/tenant";
import { TenantProvider, ThemeProvider } from "@/shared/context";
import { DEFAULT_THEME } from "@/shared/lib/constants";
import { fontStylesheetUrls } from "@/shared/lib/fonts";
import { Toaster } from "react-hot-toast";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import {
  resolveThemeVars,
  buildDarkCss,
} from "@/features/stores/theme-tokens";
import { resolveTheme } from "@/features/stores/presets";

function localizedValue(
  value: Record<string, string> | string | undefined,
  locale: string,
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value || fallback;
  return value[locale] || value["en"] || Object.values(value)[0] || fallback;
}

/** Store whose theme styles this request: none on /admin, which stays brand-neutral. */
async function getThemedTenant() {
  if (await isAdminSurface()) return null;
  return getTenant();
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await getThemedTenant();
  const theme = tenant ? resolveTheme(tenant.theme) : null;
  const light = theme?.primaryColor ?? "#3B82F6";
  const dark = theme?.dark?.primaryColor ?? light;
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: light },
      { media: "(prefers-color-scheme: dark)", color: dark },
    ],
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) {
    return { title: "E-Commerce Platform" };
  }
  const locale = await getLocale();
  const favicon = tenant.favicon || tenant.logo || "/favicon.ico";
  const mimeFor = (url: string): string => {
    const clean = url.split("?")[0].toLowerCase();
    if (clean.endsWith(".svg")) return "image/svg+xml";
    if (clean.endsWith(".png")) return "image/png";
    if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
    if (clean.endsWith(".webp")) return "image/webp";
    if (clean.endsWith(".ico")) return "image/x-icon";
    return "image/png";
  };
  return {
    title: localizedValue(tenant.seo.title, locale, tenant.name),
    description: localizedValue(
      tenant.seo.description,
      locale,
      `Shop at ${tenant.name}`
    ),
    icons: {
      icon: { url: favicon, type: mimeFor(favicon) },
      shortcut: favicon,
      apple: favicon,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: tenant.name,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();
  // Theme, fonts and `data-tenant` only for storefront requests: on /admin the page
  // keeps the platform defaults even when served from a store's domain.
  const themedTenant = (await isAdminSurface()) ? null : tenant;
  // The Theme the storefront renders: defaults ← Theme Preset ← the store's own values.
  const resolved = themedTenant ? resolveTheme(themedTenant.theme) : null;
  const theme = resolved ?? DEFAULT_THEME;
  const styles = resolved?.styles;
  const locale = await getLocale();

  const isBengali = locale === "bn";
  const bnFont = "Hind Siliguri";

  // Display face for headings (optional, per tenant). Latin display serifs carry no
  // Bengali glyphs, so in `bn` the stack falls through to Hind Siliguri per glyph:
  // Bengali headings read in Hind, while Latin ones (store name, product names)
  // keep the brand serif instead of switching typeface with the language.
  const headingFont =
    theme.headingFont && theme.headingFont !== theme.fontFamily
      ? theme.headingFont
      : undefined;

  // A store that offers Bengali loads Hind Siliguri in both locales and keeps it last
  // in the English stack: Google serves it per unicode-range, so only the Bengali
  // subset the page actually shows (the language switch label) is fetched in `en`.
  // Switching language then reuses the same stylesheet and already-cached glyphs
  // instead of downloading a new font mid-switch.
  const offersBengali = themedTenant?.supportedLanguages?.includes("bn") ?? false;

  const themeVars: Record<string, string> = {
    ...resolveThemeVars(theme, "light"),
    "--font-family": isBengali
      ? `'${bnFont}', sans-serif`
      : offersBengali
        ? `'${theme.fontFamily}', '${bnFont}', sans-serif`
        : `'${theme.fontFamily}', sans-serif`,
    "--font-heading": headingFont
      ? isBengali
        ? `'${headingFont}', '${bnFont}', serif`
        : `'${headingFont}', '${theme.fontFamily}', serif`
      : "var(--font-family)",
    "--border-radius": theme.borderRadius,
  };

  // Same families in both locales (when the store offers Bengali), so the stylesheet
  // URL does not change on a language switch.
  const fontHrefs = fontStylesheetUrls(
    offersBengali
      ? [theme.fontFamily, bnFont, headingFont]
      : isBengali
        ? [bnFont, headingFont]
        : [theme.fontFamily, headingFont]
  );
  const usesGoogleFonts = fontHrefs.some((h) => h.startsWith("https://fonts.googleapis.com/"));

  const darkCss = buildDarkCss(resolveThemeVars(theme, "dark"));

  const antiFlashScript = `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');})()`;

  return (
    <html
      lang={locale}
      style={themeVars as React.CSSProperties}
      // Storefront scope for globals.css (--ui-* primitive colours, heading font,
      // bn typography). Absent on /admin and when no store is resolved.
      data-tenant={themedTenant?.slug || undefined}
      data-bg-pattern={theme.backgroundPattern ?? "grid"}
      // x-height normalisation is tuned for the Latin serif; Bengali glyphs in the
      // same stack would shrink with it, so `bn` opts out.
      data-heading-font={headingFont && !isBengali ? "display" : undefined}
      // Style Switches (storefront only): CSS-only differences key off these;
      // structural ones are switched in components from the resolved theme.
      data-hero-style={styles?.heroStyle}
      data-category-style={styles?.categoryStyle}
      data-footer-style={styles?.footerStyle}
      data-newsletter-style={styles?.newsletterStyle}
      data-card-style={styles?.productCardStyle}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: darkCss }} />
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        {usesGoogleFonts && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          </>
        )}
        {fontHrefs.map((href) => (
          <link key={href} href={href} rel="stylesheet" />
        ))}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          {/* Storefront components read the resolved theme (preset applied); the
              admin surface keeps the raw store record. */}
          <TenantProvider tenant={themedTenant && resolved ? { ...themedTenant, theme: resolved } : tenant}>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" />
            </ThemeProvider>
          </TenantProvider>
        </NextIntlClientProvider>
        {/* Reload on controllerchange only when an older worker was replaced: on a first
            visit clients.claim() also fires it, and reloading then just costs a page load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!('serviceWorker' in navigator))return;
var reloading=false;var hadController=!!navigator.serviceWorker.controller;
navigator.serviceWorker.addEventListener('controllerchange',function(){if(reloading||!hadController)return;reloading=true;window.location.reload();});
window.addEventListener('load',function(){
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(reg){
    function track(sw){sw.addEventListener('statechange',function(){if(sw.state==='installed'&&navigator.serviceWorker.controller){sw.postMessage('SKIP_WAITING');}});}
    if(reg.waiting&&navigator.serviceWorker.controller){reg.waiting.postMessage('SKIP_WAITING');}
    if(reg.installing)track(reg.installing);
    reg.addEventListener('updatefound',function(){if(reg.installing)track(reg.installing);});
    setInterval(function(){reg.update().catch(function(){});},60*60*1000);
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')reg.update().catch(function(){});});
  }).catch(function(){});
});})();`,
          }}
        />
      </body>
    </html>
  );
}

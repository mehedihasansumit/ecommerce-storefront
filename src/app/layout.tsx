import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getTenant } from "@/shared/lib/tenant";
import { TenantProvider, ThemeProvider } from "@/shared/context";
import { DEFAULT_THEME } from "@/shared/lib/constants";
import { Toaster } from "react-hot-toast";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import {
  resolveThemeVars,
  buildDarkCss,
} from "@/features/stores/theme-tokens";

function localizedValue(
  value: Record<string, string> | string | undefined,
  locale: string,
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value || fallback;
  return value[locale] || value["en"] || Object.values(value)[0] || fallback;
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await getTenant();
  const light = tenant?.theme?.primaryColor ?? "#3B82F6";
  const dark = tenant?.theme?.dark?.primaryColor ?? light;
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
  const favicon = tenant.favicon || tenant.logo;
  const faviconDark = tenant.faviconDark;
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
      icon: faviconDark
        ? [
            { url: favicon || "/favicon.ico", media: "(prefers-color-scheme: light)", type: mimeFor(favicon || "/favicon.ico") },
            { url: faviconDark, media: "(prefers-color-scheme: dark)", type: mimeFor(faviconDark) },
          ]
        : favicon || "/favicon.ico",
      shortcut: favicon || "/favicon.ico",
      apple: faviconDark ?? favicon ?? "/icons/apple-touch-icon.png",
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
  const theme = tenant?.theme || DEFAULT_THEME;
  const locale = await getLocale();

  const isBengali = locale === "bn";
  const bnFont = "Hind Siliguri";

  const themeVars: Record<string, string> = {
    ...resolveThemeVars(theme, "light"),
    "--font-family": isBengali
      ? `'${bnFont}', sans-serif`
      : `'${theme.fontFamily}', sans-serif`,
    "--border-radius": theme.borderRadius,
  };

  const darkCss = buildDarkCss(resolveThemeVars(theme, "dark"));

  const antiFlashScript = `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');})()`;

  return (
    <html lang={locale} style={themeVars as React.CSSProperties}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: darkCss }} />
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        {isBengali ? (
          <link
            href={`https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        ) : (
          theme.fontFamily && theme.fontFamily !== "Inter" && (
            <link
              href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@400;500;600;700&display=swap`}
              rel="stylesheet"
            />
          )
        )}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <NextIntlClientProvider>
          <TenantProvider tenant={tenant}>
            <ThemeProvider>
              {children}
              <Toaster position="top-right" />
            </ThemeProvider>
          </TenantProvider>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!('serviceWorker' in navigator))return;
var reloading=false;
navigator.serviceWorker.addEventListener('controllerchange',function(){if(reloading)return;reloading=true;window.location.reload();});
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

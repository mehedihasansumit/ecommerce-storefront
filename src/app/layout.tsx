import type { Metadata } from "next";
import "./globals.css";
import { getTenant } from "@/shared/lib/tenant";
import { TenantProvider, ThemeProvider } from "@/shared/context";
import { DEFAULT_THEME } from "@/shared/lib/constants";
import { Toaster } from "react-hot-toast";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { IStoreDarkTheme } from "@/features/stores/types";

function localizedValue(
  value: Record<string, string> | string | undefined,
  locale: string,
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value || fallback;
  return value[locale] || value["en"] || Object.values(value)[0] || fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) {
    return { title: "E-Commerce Platform" };
  }
  const locale = await getLocale();
  const favicon = tenant.favicon || tenant.logo;
  return {
    title: localizedValue(tenant.seo.title, locale, tenant.name),
    description: localizedValue(
      tenant.seo.description,
      locale,
      `Shop at ${tenant.name}`
    ),
    icons: favicon ? { icon: favicon, shortcut: favicon } : undefined,
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
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-accent": theme.accentColor,
    "--color-bg": theme.backgroundColor,
    "--color-text": theme.textColor,
    "--color-header-bg": theme.headerBg,
    "--color-header-text": theme.headerText,
    "--font-family": isBengali
      ? `'${bnFont}', sans-serif`
      : `'${theme.fontFamily}', sans-serif`,
    "--border-radius": theme.borderRadius,
    "--color-newsletter-bg": theme.newsletterBg || theme.primaryColor,
    "--color-newsletter-text": theme.newsletterText || "#FFFFFF",
    "--color-newsletter-btn-bg": theme.newsletterBtnBg || "#FFFFFF",
    "--color-newsletter-btn-text": theme.newsletterBtnText || theme.primaryColor,
    "--color-price": theme.priceColor || theme.primaryColor,
    "--color-sale-badge-bg": theme.saleBadgeBg || "#EF4444",
    "--color-sale-badge-text": theme.saleBadgeText || "#FFFFFF",
    "--color-footer-bg": theme.footerBg || theme.headerBg,
    "--color-footer-text": theme.footerText || theme.headerText,
    "--color-link": theme.linkColor || theme.primaryColor,
    "--color-card-bg": theme.cardBg || theme.backgroundColor,
  };

  const dark = theme.dark as IStoreDarkTheme | undefined;
  const darkCss = `html.dark {
    --color-primary: ${dark?.primaryColor ?? theme.primaryColor} !important;
    --color-bg: ${dark?.backgroundColor ?? "#111827"} !important;
    --color-text: ${dark?.textColor ?? "#F9FAFB"} !important;
    --color-surface: ${dark?.surfaceColor ?? "#1F2937"} !important;
    --color-border-subtle: ${dark?.borderColor ?? "#374151"} !important;
    --color-header-bg: ${dark?.headerBg ?? "#0F172A"} !important;
    --color-header-text: ${dark?.headerText ?? "#F8FAFC"} !important;
    --color-text-secondary: #E5E7EB !important;
    --color-text-tertiary: #D1D5DB !important;
    --color-newsletter-bg: ${dark?.newsletterBg ?? dark?.primaryColor ?? theme.primaryColor} !important;
    --color-newsletter-text: ${dark?.newsletterText ?? "#FFFFFF"} !important;
    --color-newsletter-btn-bg: ${dark?.newsletterBtnBg ?? "#1F2937"} !important;
    --color-newsletter-btn-text: ${dark?.newsletterBtnText ?? dark?.primaryColor ?? theme.primaryColor} !important;
    --color-price: ${dark?.priceColor ?? dark?.primaryColor ?? theme.primaryColor} !important;
    --color-sale-badge-bg: ${dark?.saleBadgeBg ?? "#DC2626"} !important;
    --color-sale-badge-text: ${dark?.saleBadgeText ?? "#FFFFFF"} !important;
    --color-footer-bg: ${dark?.footerBg ?? dark?.headerBg ?? "#0F172A"} !important;
    --color-footer-text: ${dark?.footerText ?? dark?.headerText ?? "#F8FAFC"} !important;
    --color-link: ${dark?.linkColor ?? dark?.primaryColor ?? theme.primaryColor} !important;
    --color-card-bg: ${dark?.cardBg ?? dark?.backgroundColor ?? "#111827"} !important;
  }`;

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
      </body>
    </html>
  );
}

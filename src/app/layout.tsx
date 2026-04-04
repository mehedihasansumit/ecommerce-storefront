import type { Metadata } from "next";
import "./globals.css";
import { getTenant } from "@/shared/lib/tenant";
import { TenantProvider } from "@/shared/context";
import { DEFAULT_THEME } from "@/shared/lib/constants";
import { Toaster } from "react-hot-toast";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) {
    return { title: "E-Commerce Platform" };
  }
  return {
    title: tenant.seo.title || tenant.name,
    description: tenant.seo.description || `Shop at ${tenant.name}`,
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
  };

  return (
    <html lang={locale} style={themeVars as React.CSSProperties}>
      <head>
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
            {children}
            <Toaster position="top-right" />
          </TenantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { getTenant } from "@/shared/lib/tenant";
import { TenantProvider } from "@/shared/context";
import { DEFAULT_THEME } from "@/shared/lib/constants";
import { Toaster } from "react-hot-toast";

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

  const themeVars: Record<string, string> = {
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-accent": theme.accentColor,
    "--color-bg": theme.backgroundColor,
    "--color-text": theme.textColor,
    "--color-header-bg": theme.headerBg,
    "--color-header-text": theme.headerText,
    "--font-family": `'${theme.fontFamily}', sans-serif`,
    "--border-radius": theme.borderRadius,
  };

  return (
    <html lang="en" style={themeVars as React.CSSProperties}>
      <head>
        {theme.fontFamily && theme.fontFamily !== "Inter" && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontFamily)}:wght@400;500;600;700&display=swap`}
            rel="stylesheet"
          />
        )}
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <TenantProvider tenant={tenant}>
          {children}
          <Toaster position="top-right" />
        </TenantProvider>
      </body>
    </html>
  );
}

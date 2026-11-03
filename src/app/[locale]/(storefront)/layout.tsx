import { Header } from "@/shared/components/storefront/Header";
import { Footer } from "@/shared/components/storefront/Footer";
import { MobileBottomNav } from "@/shared/components/storefront/MobileBottomNav";
import { FloatingCallButton } from "@/shared/components/storefront/FloatingCallButton";
import { CartProvider } from "@/shared/context/CartContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import {
  CategoryNamesProvider,
  type CategoryNames,
} from "@/shared/context/CategoryNamesContext";
import { AnnouncementBanner } from "@/features/notifications/components/AnnouncementBanner";
import { getStoreCategories } from "@/features/categories/storefront";
import { getTenant } from "@/shared/lib/tenant";
import { primaryDomainRedirect, storeOffersBangla } from "@/shared/lib/seo";
import { STOREFRONT_PATH_HEADER } from "@/shared/lib/app-surface";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { notFound, permanentRedirect } from "next/navigation";

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await getTenant();
  // /bn exists only for stores that offer Bangla (ADR 0004).
  if (!hasLocale(routing.locales, locale)) notFound();
  if (locale === "bn" && tenant && !storeOffersBangla(tenant)) notFound();

  // lourhaus.com → www.lourhaus.com: one domain per store for Google.
  if (tenant) {
    const requestHeaders = await headers();
    const target = primaryDomainRedirect(
      tenant,
      requestHeaders.get("host") ?? "",
      requestHeaders.get(STOREFRONT_PATH_HEADER) ?? "/",
    );
    if (target) permanentRedirect(target);
  }

  // Product cards show their category's name; one cached lookup per store.
  const categories = tenant ? await getStoreCategories(tenant._id) : [];
  const categoryNames: CategoryNames = Object.fromEntries(
    categories.map((c) => [c._id, c.name]),
  );

  return (
    <ThemeProvider>
      <CategoryNamesProvider names={categoryNames}>
        <CartProvider>
          <AnnouncementBanner />
          <Header />
          <main className="flex-1 storefront-grid-bg">{children}</main>
          <Footer />
          {/* Phones: keep the footer's last row clear of the fixed bottom nav (3.5rem).
            The floating call button steps aside while the footer is on screen. */}
          <div
            aria-hidden
            className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]"
            style={{ backgroundColor: "var(--color-footer-bg)" }}
          />
          <MobileBottomNav />
          <FloatingCallButton />
        </CartProvider>
      </CategoryNamesProvider>
    </ThemeProvider>
  );
}

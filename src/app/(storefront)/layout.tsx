import { Header } from "@/shared/components/storefront/Header";
import { Footer } from "@/shared/components/storefront/Footer";
import { MobileBottomNav } from "@/shared/components/storefront/MobileBottomNav";
import { FloatingCallButton } from "@/shared/components/storefront/FloatingCallButton";
import { CartProvider } from "@/shared/context/CartContext";
import { ThemeProvider } from "@/shared/context/ThemeContext";
import { AnnouncementBanner } from "@/features/notifications/components/AnnouncementBanner";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

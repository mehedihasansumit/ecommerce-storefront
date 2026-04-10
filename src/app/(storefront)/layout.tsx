import { Header } from "@/shared/components/storefront/Header";
import { Footer } from "@/shared/components/storefront/Footer";
import { CartProvider } from "@/shared/context/CartContext";
import { AnnouncementBanner } from "@/features/notifications/components/AnnouncementBanner";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <AnnouncementBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}

import { Header } from "@/shared/components/storefront/Header";
import { Footer } from "@/shared/components/storefront/Footer";
import { CartProvider } from "@/shared/context/CartContext";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}

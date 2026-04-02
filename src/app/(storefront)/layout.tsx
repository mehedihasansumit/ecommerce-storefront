import { Header } from "@/shared/components/storefront/Header";
import { Footer } from "@/shared/components/storefront/Footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

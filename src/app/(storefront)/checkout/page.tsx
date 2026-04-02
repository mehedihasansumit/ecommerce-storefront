import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <p className="text-gray-500">Checkout flow will be implemented here.</p>
    </div>
  );
}

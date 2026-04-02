import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-4">Your cart is empty</p>
        <a
          href="/products"
          className="inline-block px-6 py-2 text-white font-medium"
          style={{
            backgroundColor: "var(--color-primary)",
            borderRadius: "var(--border-radius)",
          }}
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

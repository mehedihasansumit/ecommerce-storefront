import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Orders" };

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <p className="text-gray-500">Please log in to view your orders.</p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Order Detail" };

export default function OrderDetailPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Order Detail</h1>
      <p className="text-gray-500">Order details will be shown here.</p>
    </div>
  );
}

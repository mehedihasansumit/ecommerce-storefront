import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Account" };

export default function AccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      <p className="text-gray-500">Account management will be shown here.</p>
    </div>
  );
}

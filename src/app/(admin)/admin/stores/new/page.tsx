import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Store" };

export default function NewStorePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Store</h1>
      <p className="text-gray-500">Store creation form will be implemented here.</p>
    </div>
  );
}

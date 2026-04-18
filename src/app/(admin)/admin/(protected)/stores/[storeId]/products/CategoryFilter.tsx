"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  storeId: string;
  categories: { _id: string; label: string }[];
  defaultCategory?: string;
}

export function CategoryFilter({ storeId, categories, defaultCategory }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set("category", e.target.value);
    else params.delete("category");
    params.delete("page");
    router.push(`/admin/stores/${storeId}/products?${params.toString()}`);
  }

  return (
    <select
      defaultValue={defaultCategory ?? ""}
      onChange={handleChange}
      className="pl-3 pr-8 py-2 text-sm border border-admin-border rounded-lg bg-admin-surface text-admin-text-secondary focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
    >
      <option value="">All Categories</option>
      {categories.map((c) => (
        <option key={c._id} value={c._id}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

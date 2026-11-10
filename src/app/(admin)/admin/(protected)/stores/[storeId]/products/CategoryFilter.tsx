"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/shared/components/ui";

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
    <div className="w-full sm:w-auto sm:min-w-48">
      <Select
        defaultValue={defaultCategory ?? ""}
        onChange={handleChange}
        aria-label="Filter by category"
        className="cursor-pointer"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

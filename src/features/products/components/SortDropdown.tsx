"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Top Rated", value: "averageRating_desc" },
];

interface SortDropdownProps {
  currentSort?: string;
  currentOrder?: string;
  label?: string;
}

export function SortDropdown({ currentSort, currentOrder, label = "Sort" }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const value = `${currentSort || "createdAt"}_${currentOrder || "desc"}`;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    const [sort, order] = e.target.value.split("_");
    params.set("sort", sort);
    params.set("order", order);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown size={14} className="text-gray-400 shrink-0" />
      <select
        value={value}
        onChange={handleChange}
        className="text-sm border border-gray-200 bg-white py-1.5 pl-2 pr-7 focus:outline-none focus:ring-2 focus:border-transparent appearance-none cursor-pointer text-gray-700"
        style={{
          borderRadius: "var(--border-radius)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
        aria-label={label}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

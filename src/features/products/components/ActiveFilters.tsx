"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface ActiveFiltersProps {
  search?: string;
  categorySlug?: string;
  categoryName?: string;
}

export function ActiveFilters({ search, categorySlug, categoryName }: ActiveFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!search && !categorySlug) return null;

  function removeFilter(key: "search" | "category") {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="text-xs text-admin-text-subtle font-medium">Active filters:</span>

      {categorySlug && (
        <button
          onClick={() => removeFilter("category")}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          {categoryName || categorySlug}
          <X size={11} />
        </button>
      )}

      {search && (
        <button
          onClick={() => removeFilter("search")}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          &ldquo;{search}&rdquo;
          <X size={11} />
        </button>
      )}
    </div>
  );
}

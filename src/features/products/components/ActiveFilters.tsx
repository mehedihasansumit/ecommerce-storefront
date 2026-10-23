"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface ActiveFiltersProps {
  search?: string;
  categorySlug?: string;
  categoryName?: string;
}

export function ActiveFilters({ search, categorySlug, categoryName }: ActiveFiltersProps) {
  const t = useTranslations("products");
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
      <span className="text-xs text-text-tertiary font-medium">{t("activeFilters")}</span>

      {categorySlug && (
        <button
          type="button"
          onClick={() => removeFilter("category")}
          aria-label={t("removeFilter", { name: categoryName || categorySlug })}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          {categoryName || categorySlug}
          <X size={11} aria-hidden />
        </button>
      )}

      {search && (
        <button
          type="button"
          onClick={() => removeFilter("search")}
          aria-label={t("removeFilter", { name: `“${search}”` })}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-colors hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          &ldquo;{search}&rdquo;
          <X size={11} aria-hidden />
        </button>
      )}
    </div>
  );
}

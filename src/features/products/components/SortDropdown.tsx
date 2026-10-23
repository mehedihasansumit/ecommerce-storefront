"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

const SORT_OPTIONS = [
  { labelKey: "sortNewest", value: "createdAt_desc" },
  { labelKey: "sortPriceAsc", value: "price_asc" },
  { labelKey: "sortPriceDesc", value: "price_desc" },
  { labelKey: "sortTopRated", value: "averageRating_desc" },
] as const;

interface SortDropdownProps {
  currentSort?: string;
  currentOrder?: string;
  label?: string;
}

export function SortDropdown({ currentSort, currentOrder, label }: SortDropdownProps) {
  const t = useTranslations("products");
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
      <ArrowUpDown size={14} aria-hidden className="text-text-tertiary shrink-0" />
      <select
        value={value}
        onChange={handleChange}
        className="focus-ring min-h-10 text-sm border border-input-border bg-[var(--color-card-bg)] py-1.5 pl-3 pr-8 appearance-none cursor-pointer text-[var(--color-text)]"
        style={{
          borderRadius: "var(--border-radius)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
        }}
        aria-label={label ?? t("sortLabel")}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}

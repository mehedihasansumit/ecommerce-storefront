"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui";

interface Props {
  storeId: string;
  defaultValue?: string;
}

export function ProductsSearch({ storeId, defaultValue }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");

  function navigate(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/admin/stores/${storeId}/products?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(value.trim());
  }

  function handleClear() {
    setValue("");
    navigate("");
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative flex-1 min-w-48 max-w-xs">
      <Search
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted pointer-events-none z-10"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products…"
        aria-label="Search products"
        className="pl-9 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-secondary transition-colors focus-ring"
        >
          <X aria-hidden className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}

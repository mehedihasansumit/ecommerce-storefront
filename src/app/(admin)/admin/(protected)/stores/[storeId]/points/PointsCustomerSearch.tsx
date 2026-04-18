"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";

interface Props {
  storeId: string;
  defaultValue?: string;
}

export function PointsCustomerSearch({ storeId, defaultValue }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");

  function navigate(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/admin/stores/${storeId}/points?${params.toString()}`);
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
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-xs">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-subtle pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name, email, phone…"
        className="w-full pl-9 pr-8 py-2 text-sm border border-admin-border rounded-lg bg-admin-surface focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-admin-text-subtle"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-admin-text-subtle hover:text-admin-text-secondary"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}

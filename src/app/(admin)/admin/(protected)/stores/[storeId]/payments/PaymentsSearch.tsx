"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui";

interface Props {
  storeId: string;
  defaultValue?: string;
}

export function PaymentsSearch({ storeId, defaultValue }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue ?? "");

  function navigate(q: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    params.delete("page");
    router.push(`/admin/stores/${storeId}/payments?${params.toString()}`);
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
    <form role="search" onSubmit={handleSubmit} className="relative w-full sm:w-64">
      <Search
        aria-hidden
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-subtle pointer-events-none"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Order #, name, phone…"
        aria-label="Search payments"
        className="pl-9 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="focus-ring absolute right-0.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-lg text-admin-text-muted hover:text-admin-text-primary transition-colors"
        >
          <X aria-hidden className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}

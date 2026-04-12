"use client";

import { Search } from "lucide-react";
import { useTrackEvent } from "@/features/analytics/hooks/useTrackEvent";

interface SearchFormWithTrackingProps {
  defaultValue?: string;
  placeholder?: string;
}

export function SearchFormWithTracking({
  defaultValue = "",
  placeholder = "Search...",
}: SearchFormWithTrackingProps) {
  const track = useTrackEvent();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const input = e.currentTarget.elements.namedItem("search") as HTMLInputElement;
    const query = input?.value?.trim();
    if (query) {
      track({ eventType: "search", searchQuery: query });
    }
  }

  return (
    <form method="get" action="/products" className="mb-4" onSubmit={handleSubmit}>
      <div className="relative">
        <input
          type="text"
          name="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          style={{ borderRadius: "var(--border-radius)" }}
        />
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>
    </form>
  );
}

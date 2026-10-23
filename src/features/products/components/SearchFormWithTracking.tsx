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
    <form method="get" action="/products" role="search" className="mb-4" onSubmit={handleSubmit}>
      <div className="relative">
        <input
          type="search"
          name="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="search"
          className="focus-ring w-full min-h-11 pl-9 pr-3 py-2 text-sm bg-[var(--color-card-bg)] text-[var(--color-text)] placeholder:text-text-tertiary border border-input-border transition-colors"
          style={{ borderRadius: "var(--border-radius)" }}
        />
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
      </div>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button, Input } from "@/shared/components/ui";

interface Props {
  storeId: string;
  from: string;
  to: string;
}

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function getPresetDates(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function isPresetActive(from: string, to: string, days: number) {
  const preset = getPresetDates(days);
  return from === preset.from && to === preset.to;
}

export function DateRangeFilter({ storeId, from, to }: Props) {
  const router = useRouter();
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  function applyPreset(days: number) {
    const { from: f, to: t } = getPresetDates(days);
    router.push(`/admin/stores/${storeId}/analytics?from=${f}&to=${t}`);
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/admin/stores/${storeId}/analytics?from=${localFrom}&to=${localTo}`);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Presets */}
      <div
        role="group"
        aria-label="Date range presets"
        className="flex items-center gap-1 bg-admin-chip rounded-lg p-1 self-start sm:self-auto"
      >
        {PRESETS.map(({ label, days }) => {
          const active = isPresetActive(from, to, days);
          return (
            <button
              key={label}
              type="button"
              onClick={() => applyPreset(days)}
              aria-pressed={active}
              aria-label={`Last ${days} days`}
              className={`min-h-8 px-3 py-1 text-xs font-medium rounded-md transition-colors focus-ring ${
                active
                  ? "bg-admin-surface text-admin-text-primary shadow-sm"
                  : "text-admin-text-muted hover:text-admin-text-secondary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Custom range */}
      <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-1.5">
        <CalendarDays aria-hidden className="w-4 h-4 text-admin-text-muted shrink-0" />
        <Input
          type="date"
          aria-label="From date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="w-auto min-w-0"
        />
        <span aria-hidden className="text-admin-text-muted text-sm">—</span>
        <Input
          type="date"
          aria-label="To date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="w-auto min-w-0"
        />
        <Button type="submit" variant="primary" size="md" className="shrink-0">
          Apply
        </Button>
      </form>
    </div>
  );
}

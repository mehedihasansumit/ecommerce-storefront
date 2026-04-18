"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays } from "lucide-react";

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
      <div className="flex items-center gap-1 bg-admin-chip rounded-lg p-1 self-start sm:self-auto">
        {PRESETS.map(({ label, days }) => (
          <button
            key={label}
            onClick={() => applyPreset(days)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isPresetActive(from, to, days)
                ? "bg-admin-surface text-admin-text-primary shadow-sm"
                : "text-admin-text-muted hover:text-admin-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-admin-text-subtle shrink-0" />
        <input
          type="date"
          value={localFrom}
          onChange={(e) => setLocalFrom(e.target.value)}
          className="text-xs border border-admin-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-200 text-admin-text-secondary min-w-0"
        />
        <span className="text-gray-300 text-sm">—</span>
        <input
          type="date"
          value={localTo}
          onChange={(e) => setLocalTo(e.target.value)}
          className="text-xs border border-admin-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-200 text-admin-text-secondary min-w-0"
        />
        <button
          type="submit"
          className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shrink-0"
        >
          Apply
        </button>
      </form>
    </div>
  );
}

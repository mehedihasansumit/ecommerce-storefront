"use client";

import type { ReactNode } from "react";
import type { IProductOption } from "../types";
import { useOptionLabels } from "@/shared/hooks/useOptionLabels";

interface VariantOptionsProps {
  options: IProductOption[];
  selectedOptions: Record<string, string>;
  onSelect: (name: string, value: string) => void;
  isValueAvailable: (optionName: string, value: string) => boolean;
  /** Rendered at the end of an option's label row (e.g. "Size guide" beside Size). */
  labelAction?: (optionName: string) => ReactNode;
  /** Rendered under an option's chips (e.g. the chosen size's measurements). */
  afterValues?: (optionName: string) => ReactNode;
}

/**
 * Presentational variant option chips. Shared by the desktop inline selector
 * (AddToCartSection) and the mobile bottom sheet (MobileBuyBar) so chips look identical.
 */
export function VariantOptions({
  options,
  selectedOptions,
  onSelect,
  isValueAvailable,
  labelAction,
  afterValues,
}: VariantOptionsProps) {
  const label = useOptionLabels();
  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.name}>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {label.name(option.name)}
              {selectedOptions[option.name] && (
                <span className="font-normal text-text-secondary ml-1">
                  — {label.value(selectedOptions[option.name])}
                </span>
              )}
            </label>
            {labelAction?.(option.name)}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={label.name(option.name)}>
            {option.values.map((value) => {
              const available = isValueAvailable(option.name, value);
              const selected = selectedOptions[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSelect(option.name, value)}
                  disabled={!available}
                  aria-pressed={selected}
                  className={`focus-ring px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
                    selected
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                      : available
                      ? "border-border-subtle text-text-secondary hover:border-primary/40 hover:shadow-sm"
                      : "border-border-subtle text-text-tertiary cursor-not-allowed line-through"
                  }`}
                  style={{
                    borderRadius: "var(--border-radius)",
                    ...(selected
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                        }
                      : undefined),
                  }}
                >
                  {label.value(value)}
                </button>
              );
            })}
          </div>
          {afterValues?.(option.name)}
        </div>
      ))}
    </div>
  );
}

"use client";

import type { IProductOption } from "../types";

interface VariantOptionsProps {
  options: IProductOption[];
  selectedOptions: Record<string, string>;
  onSelect: (name: string, value: string) => void;
  isValueAvailable: (optionName: string, value: string) => boolean;
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
}: VariantOptionsProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <div key={option.name}>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-2.5 text-text-secondary">
            {option.name}
            {selectedOptions[option.name] && (
              <span className="font-normal text-text-secondary ml-1">
                — {selectedOptions[option.name]}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const available = isValueAvailable(option.name, value);
              const selected = selectedOptions[option.name] === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onSelect(option.name, value)}
                  disabled={!available}
                  className={`px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
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
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

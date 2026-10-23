"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const BASE =
  "w-full min-h-10 appearance-none pl-3 pr-9 py-2 text-sm bg-[var(--ui-field-bg,#fff)] text-[var(--ui-field-text,inherit)] border rounded-lg transition-colors " +
  "dark:bg-[var(--ui-field-bg-dark,#111827)] dark:text-[var(--ui-field-text-dark,#f3f4f6)] " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-ring,var(--color-primary))] " +
  "disabled:bg-[var(--ui-field-disabled-bg,#f9fafb)] disabled:text-[var(--ui-field-disabled-text,#6b7280)] disabled:cursor-not-allowed dark:disabled:bg-[var(--ui-field-disabled-bg-dark,#1f2937)] dark:disabled:text-[var(--ui-field-disabled-text-dark,#6b7280)]";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className, children, "aria-invalid": ariaInvalid, ...rest },
  ref
) {
  const isInvalid = invalid || ariaInvalid;
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={isInvalid || undefined}
        className={[
          BASE,
          isInvalid ? "border-[var(--ui-field-border-invalid,#f87171)] dark:border-[var(--ui-field-border-invalid-dark,#dc2626)]" : "border-[var(--ui-field-border,#d1d5db)] hover:border-[var(--ui-field-border-hover,#9ca3af)] dark:border-[var(--ui-field-border-dark,#4b5563)] dark:hover:border-[var(--ui-field-border-hover-dark,#6b7280)]",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ui-muted,#9ca3af)] pointer-events-none"
      />
    </div>
  );
});

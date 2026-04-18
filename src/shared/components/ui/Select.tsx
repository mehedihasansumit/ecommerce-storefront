"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const BASE =
  "w-full appearance-none pl-3 pr-9 py-2 text-sm bg-white border rounded-lg transition-colors " +
  "dark:bg-gray-900 dark:text-gray-100 " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-primary)] " +
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-500";

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
          isInvalid ? "border-red-400 dark:border-red-600" : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500",
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
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
});

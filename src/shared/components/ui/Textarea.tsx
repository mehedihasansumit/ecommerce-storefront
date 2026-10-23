"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const BASE =
  "w-full min-h-10 px-3 py-2 text-sm bg-[var(--ui-field-bg,#fff)] text-[var(--ui-field-text,inherit)] border rounded-lg transition-colors " +
  "dark:bg-[var(--ui-field-bg-dark,#111827)] dark:text-[var(--ui-field-text-dark,#f3f4f6)] " +
  "placeholder:text-[var(--ui-placeholder,#9ca3af)] dark:placeholder:text-[var(--ui-placeholder-dark,#6b7280)] " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-ring,var(--color-primary))] " +
  "disabled:bg-[var(--ui-field-disabled-bg,#f9fafb)] disabled:text-[var(--ui-field-disabled-text,#6b7280)] disabled:cursor-not-allowed dark:disabled:bg-[var(--ui-field-disabled-bg-dark,#1f2937)] dark:disabled:text-[var(--ui-field-disabled-text-dark,#6b7280)] resize-y";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, "aria-invalid": ariaInvalid, ...rest },
  ref
) {
  const isInvalid = invalid || ariaInvalid;
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={isInvalid || undefined}
      className={[
        BASE,
        isInvalid ? "border-[var(--ui-field-border-invalid,#f87171)] dark:border-[var(--ui-field-border-invalid-dark,#dc2626)]" : "border-[var(--ui-field-border,#d1d5db)] hover:border-[var(--ui-field-border-hover,#9ca3af)] dark:border-[var(--ui-field-border-dark,#4b5563)] dark:hover:border-[var(--ui-field-border-hover-dark,#6b7280)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});

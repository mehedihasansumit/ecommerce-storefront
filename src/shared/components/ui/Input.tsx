"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  invalid?: boolean;
  /** Fixed lead-in shown inside the field before the value (e.g. "+88" for a phone number).
   *  The field and its prefix share one border, background and focus ring, so they follow the
   *  same tokens as a plain Input in light and dark. */
  prefix?: ReactNode;
}

const FIELD_BG =
  "bg-[var(--ui-field-bg,#fff)] dark:bg-[var(--ui-field-bg-dark,#111827)]";
const FIELD_TEXT =
  "text-[var(--ui-field-text,inherit)] dark:text-[var(--ui-field-text-dark,#f3f4f6)] " +
  "placeholder:text-[var(--ui-placeholder,#9ca3af)] dark:placeholder:text-[var(--ui-placeholder-dark,#6b7280)]";
const BORDER_OK =
  "border-[var(--ui-field-border,#d1d5db)] hover:border-[var(--ui-field-border-hover,#9ca3af)] dark:border-[var(--ui-field-border-dark,#4b5563)] dark:hover:border-[var(--ui-field-border-hover-dark,#6b7280)]";
const BORDER_INVALID =
  "border-[var(--ui-field-border-invalid,#f87171)] dark:border-[var(--ui-field-border-invalid-dark,#dc2626)]";

const BASE =
  `w-full min-h-10 px-3 py-2 text-sm ${FIELD_BG} ${FIELD_TEXT} border rounded-lg transition-colors ` +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--focus-ring,var(--color-primary))] " +
  "disabled:bg-[var(--ui-field-disabled-bg,#f9fafb)] disabled:text-[var(--ui-field-disabled-text,#6b7280)] disabled:cursor-not-allowed dark:disabled:bg-[var(--ui-field-disabled-bg-dark,#1f2937)] dark:disabled:text-[var(--ui-field-disabled-text-dark,#6b7280)]";

const PREFIXED_WRAP =
  `flex min-h-10 items-stretch overflow-hidden border rounded-lg transition-colors ${FIELD_BG} ` +
  "focus-within:outline-2 focus-within:outline-offset-[-1px] focus-within:outline-[var(--focus-ring,var(--color-primary))] " +
  "has-[:disabled]:bg-[var(--ui-field-disabled-bg,#f9fafb)] dark:has-[:disabled]:bg-[var(--ui-field-disabled-bg-dark,#1f2937)]";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, prefix, style, "aria-invalid": ariaInvalid, ...rest },
  ref
) {
  const isInvalid = invalid || ariaInvalid;
  const border = isInvalid ? BORDER_INVALID : BORDER_OK;

  if (prefix) {
    return (
      <div className={[PREFIXED_WRAP, border, className ?? ""].join(" ")} style={style}>
        <span className="flex shrink-0 items-center gap-1.5 pl-3 pr-2 text-sm font-medium select-none text-[var(--ui-muted,#6b7280)] dark:text-[var(--ui-muted-dark,#9ca3af)]">
          {prefix}
        </span>
        <input
          ref={ref}
          aria-invalid={isInvalid || undefined}
          className={`min-w-0 flex-1 bg-transparent py-2 pr-3 text-sm outline-none disabled:cursor-not-allowed ${FIELD_TEXT}`}
          {...rest}
        />
      </div>
    );
  }

  return (
    <input
      ref={ref}
      aria-invalid={isInvalid || undefined}
      className={[BASE, border, className ?? ""].filter(Boolean).join(" ")}
      style={style}
      {...rest}
    />
  );
});

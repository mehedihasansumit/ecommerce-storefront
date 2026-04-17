"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const BASE =
  "w-full px-3 py-2 text-sm bg-white border rounded-lg transition-colors " +
  "placeholder:text-gray-400 " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-primary)] " +
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed resize-y";

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
        isInvalid ? "border-red-400" : "border-gray-300 hover:border-gray-400",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
});

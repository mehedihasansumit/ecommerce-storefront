"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const BASE =
  "w-full px-3 py-2 text-sm bg-white border rounded-lg transition-colors " +
  "placeholder:text-gray-400 " +
  "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-[var(--color-primary)] " +
  "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, "aria-invalid": ariaInvalid, ...rest },
  ref
) {
  const isInvalid = invalid || ariaInvalid;
  return (
    <input
      ref={ref}
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

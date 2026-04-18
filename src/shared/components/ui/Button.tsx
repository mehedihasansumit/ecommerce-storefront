"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "brand"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-outline";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-sm",
  icon: "p-2",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white",
  brand: "text-white hover:brightness-110 shadow-sm hover:shadow-md",
  secondary: "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-outline":
    "border border-red-200 text-red-600 hover:bg-red-50 bg-white dark:bg-gray-900 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
};

const RADIUS = "rounded-lg";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    children,
    className,
    type,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;
  const brandStyle =
    variant === "brand" ? { backgroundColor: "var(--color-primary)" } : undefined;

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={brandStyle}
      className={[
        BASE,
        RADIUS,
        SIZES[size],
        VARIANTS[variant],
        fullWidth ? "w-full" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 16} className="animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

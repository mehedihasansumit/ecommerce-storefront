"use client";

import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "brand"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-outline"
  /** Controls laid over photos/video (hero pause, slide arrows): light ink on a dark veil. */
  | "overlay";

/** xl = the primary storefront buy CTA (Add to cart): 48px+ touch target. */
export type ButtonSize = "sm" | "md" | "lg" | "xl" | "icon";

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
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring,var(--color-primary))] " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-sm",
  xl: "px-6 py-3.5 text-base font-semibold",
  icon: "p-2",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white",
  brand: "hover:brightness-110 shadow-sm hover:shadow-md",
  secondary: "bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-outline":
    "border border-red-200 text-red-600 hover:bg-red-50 bg-white dark:bg-gray-900 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950",
  overlay:
    "bg-black/30 text-white border border-white/35 backdrop-blur-md hover:bg-black/50 hover:border-white/60 focus-visible:outline-white",
};

/** Overlay controls sit on media as round chips; everything else uses the small-control radius. */
function radiusFor(variant: ButtonVariant) {
  return variant === "overlay" ? "rounded-full" : "rounded-lg";
}

/** Inline style for variants that read the tenant brand colour. */
export function buttonStyle(variant: ButtonVariant) {
  return variant === "brand"
    ? // on-primary = white or near-black, whichever reads on the store's brand colour.
      { backgroundColor: "var(--color-primary)", color: "var(--color-on-primary, #fff)" }
    : undefined;
}

/** Class list shared by <Button> and <ButtonLink>, so links that look like buttons stay in sync. */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  return [BASE, radiusFor(variant), SIZES[size], VARIANTS[variant], fullWidth ? "w-full" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
}

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

  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={buttonStyle(variant)}
      className={buttonClassName({ variant, size, fullWidth, className })}
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

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Navigation that must look like a Button (e.g. hero "Shop now"). Same variants,
 * sizes and focus ring as <Button>, but renders a real link so it can be opened
 * in a new tab and is announced as a link.
 */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth,
  children,
  className,
  style,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      style={{ ...buttonStyle(variant), ...style }}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}

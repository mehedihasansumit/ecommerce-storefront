/**
 * Button look (variants, sizes, classes) with no "use client": server components can call
 * buttonClassName() to style a next/link as a button (e.g. admin "New Store" links).
 */
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


const BASE =
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring,var(--color-primary))] " +
  "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] whitespace-nowrap";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-2.5 text-sm",
  xl: "px-6 py-3.5 text-base font-semibold",
  // 40×40 minimum touch target (spec) with a 16–18px glyph.
  icon: "p-2.5 min-w-10 min-h-10",
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

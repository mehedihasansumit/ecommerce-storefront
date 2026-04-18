import type { ReactNode } from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "accent";
type Size = "sm" | "md";

interface BadgeProps {
  tone?: Tone;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const TONES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  brand: "", // uses inline style var(--color-primary)
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  accent: "", // uses inline style var(--color-accent)
};

const SIZES: Record<Size, string> = {
  sm: "px-1.5 py-0.5 text-[10px]",
  md: "px-2 py-0.5 text-xs",
};

export function Badge({ tone = "neutral", size = "md", children, className }: BadgeProps) {
  const brandStyle =
    tone === "brand"
      ? {
          backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
          color: "var(--color-primary)",
        }
      : tone === "accent"
        ? {
            backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
            color: "var(--color-accent)",
          }
        : undefined;

  return (
    <span
      style={brandStyle}
      className={[
        "inline-flex items-center gap-1 font-semibold rounded-md leading-tight whitespace-nowrap",
        TONES[tone],
        SIZES[size],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

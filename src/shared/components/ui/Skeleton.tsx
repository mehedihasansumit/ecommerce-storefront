import type { CSSProperties, ReactNode } from "react";

// Server-component safe (no hooks): loading.tsx files and client fallbacks share it.
// Colours come from the `.shimmer` class (globals.css), which mixes the tenant's
// --color-surface and --color-text, so blocks read in light and dark mode alike and
// stop animating under prefers-reduced-motion.

type Radius = "theme" | "lg" | "full" | "none";

const RADIUS: Record<Radius, string> = {
  theme: "",
  lg: "rounded-lg",
  full: "rounded-full",
  none: "",
};

interface SkeletonProps {
  className?: string;
  /** "theme" follows the tenant --border-radius (product cards, hero, images). */
  radius?: Radius;
  style?: CSSProperties;
}

/** One placeholder block. Size it with the same classes the real element uses. */
export function Skeleton({ className, radius = "theme", style }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={["shimmer", RADIUS[radius], className ?? ""].join(" ")}
      style={radius === "theme" ? { borderRadius: "var(--border-radius)", ...style } : style}
    />
  );
}

interface SkeletonTextProps {
  /** Typography classes of the real text (size + leading): the line box then matches. */
  className?: string;
  /** Width of the bar, e.g. "w-40" or "w-3/4". */
  width?: string;
  lines?: number;
  /** Width of the last line when lines > 1. */
  lastWidth?: string;
  /** Extra classes for the last line when lines > 1, e.g. "sm:hidden" for a title that wraps only on phones. */
  lastLineClassName?: string;
}

/**
 * Placeholder for a run of text. Each line is as tall as the real line box (it
 * inherits font-size/line-height from `className`) and shows a bar at ~0.7em, so
 * the swap to real text moves nothing.
 */
export function SkeletonText({
  className,
  width = "w-full",
  lines = 1,
  lastWidth,
  lastLineClassName,
}: SkeletonTextProps) {
  return (
    <div aria-hidden className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={lines > 1 && i === lines - 1 ? lastLineClassName : undefined}>
          <span
            className={`shimmer inline-block h-[0.7em] max-w-full align-middle rounded-sm ${
              i === lines - 1 && lastWidth ? lastWidth : width
            }`}
          />
        </div>
      ))}
    </div>
  );
}

interface SkeletonRegionProps {
  /** Translated "Loading…" text for screen readers. */
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** Wraps a skeleton page: announces loading once, hides the decorative blocks. */
export function SkeletonRegion({ label, className, style, children }: SkeletonRegionProps) {
  return (
    <div role="status" aria-busy="true" className={className} style={style}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

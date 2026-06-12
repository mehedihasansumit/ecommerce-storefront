import type { CSSProperties } from "react";

export interface AvatarPosition {
  x: number;
  y: number;
  zoom: number;
}

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 56,
  xl: 88,
};

const FONT_CLASS: Record<AvatarSize, string> = {
  sm: "text-xs",
  md: "text-base",
  lg: "text-lg",
  xl: "text-2xl",
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface AvatarProps {
  src?: string | null;
  position?: AvatarPosition | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

/**
 * Circular avatar. Renders the photo with the customer's chosen framing
 * (object-position % + zoom scale); falls back to brand-colored initials.
 */
export function Avatar({ src, position, name, size = "md", className = "" }: AvatarProps) {
  const px = SIZE_PX[size];
  const dims: CSSProperties = { width: px, height: px };

  if (src) {
    const pos = position ?? { x: 50, y: 50, zoom: 1 };
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full select-none ${className}`}
        style={dims}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          draggable={false}
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${pos.x}% ${pos.y}%`,
            transform: `scale(${pos.zoom})`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center text-white font-bold select-none ${FONT_CLASS[size]} ${className}`}
      style={{ ...dims, backgroundColor: "var(--color-primary)" }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

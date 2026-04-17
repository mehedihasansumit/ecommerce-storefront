import { Loader2 } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: Size;
  label?: string;
  className?: string;
}

const SIZES: Record<Size, number> = {
  sm: 14,
  md: 18,
  lg: 28,
};

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={["inline-flex items-center", className ?? ""].filter(Boolean).join(" ")}
    >
      <Loader2 size={SIZES[size]} className="animate-spin text-gray-400" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

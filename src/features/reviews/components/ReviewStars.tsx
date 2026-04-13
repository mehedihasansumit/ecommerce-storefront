import { Star } from "lucide-react";

interface ReviewStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

const SIZE_MAP = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function ReviewStars({ rating, size = "md", showValue = false }: ReviewStarsProps) {
  const starSize = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i;
        const partial = !filled && rating > i - 1;
        const fillPercent = partial ? Math.round((rating - (i - 1)) * 100) : 0;

        return (
          <span key={i} className="relative inline-block">
            {/* Background star (empty) */}
            <Star className={`${starSize} text-gray-200`} fill="currentColor" />
            {/* Foreground star (filled) */}
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${fillPercent}%` }}
              >
                <Star
                  className={`${starSize} text-yellow-400`}
                  fill="currentColor"
                />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

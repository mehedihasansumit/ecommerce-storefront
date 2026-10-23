interface PriceProps {
  amount: number;
  compareAt?: number;
  currency?: string;
  locale?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: { primary: "text-sm font-semibold", compare: "text-xs" },
  md: { primary: "text-base font-bold", compare: "text-xs" },
  lg: { primary: "text-xl font-bold", compare: "text-sm" },
  xl: { primary: "text-2xl md:text-3xl font-bold", compare: "text-lg" },
};

/** Plain-text money formatting (same rules as <Price>), for amounts inside sentences. */
export function formatPrice(amount: number, currency = "BDT", locale = "en"): string {
  if (currency === "BDT") {
    return `৳${amount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}`;
  }
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function Price({
  amount,
  compareAt,
  currency = "BDT",
  locale = "en",
  size = "md",
  className,
}: PriceProps) {
  const hasDiscount = !!compareAt && compareAt > amount;
  const s = SIZES[size];

  return (
    <span
      className={[
        "inline-flex items-baseline gap-2",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={s.primary} style={{ color: "var(--color-price)" }}>
        {formatPrice(amount, currency, locale)}
      </span>
      {hasDiscount && (
        <span className={`${s.compare} text-text-secondary line-through`}>
          {formatPrice(compareAt!, currency, locale)}
        </span>
      )}
    </span>
  );
}

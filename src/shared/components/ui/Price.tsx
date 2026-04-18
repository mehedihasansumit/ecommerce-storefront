interface PriceProps {
  amount: number;
  compareAt?: number;
  currency?: string;
  locale?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { primary: "text-sm font-semibold", compare: "text-xs" },
  md: { primary: "text-base font-bold", compare: "text-xs" },
  lg: { primary: "text-xl font-bold", compare: "text-sm" },
};

function formatMoney(amount: number, currency: string, locale: string): string {
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
  const hasDiscount = compareAt && compareAt > amount;
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
        {formatMoney(amount, currency, locale)}
      </span>
      {hasDiscount && (
        <span className={`${s.compare} text-gray-400 line-through`}>
          {formatMoney(compareAt!, currency, locale)}
        </span>
      )}
    </span>
  );
}

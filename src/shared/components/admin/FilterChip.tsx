import Link from "next/link";
import type { ReactNode } from "react";

interface FilterChipBaseProps {
  selected: boolean;
  children: ReactNode;
  className?: string;
}

type FilterChipProps =
  | (FilterChipBaseProps & { href: string; onClick?: never })
  | (FilterChipBaseProps & { href?: undefined; onClick: () => void });

const base =
  "inline-flex items-center justify-center min-h-10 px-4 rounded-full text-xs font-medium border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100";
const selectedCls = "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100";
const unselectedCls =
  "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400";

/**
 * Admin filter pill. As a link (URL-driven filters) it marks the selected chip
 * with aria-current; as a button (client-state filters) it uses aria-pressed.
 */
export function FilterChip({ selected, children, className, href, onClick }: FilterChipProps) {
  const cls = [base, selected ? selectedCls : unselectedCls, className ?? ""]
    .filter(Boolean)
    .join(" ");

  if (href !== undefined) {
    return (
      <Link href={href} aria-current={selected ? "page" : undefined} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={cls}>
      {children}
    </button>
  );
}

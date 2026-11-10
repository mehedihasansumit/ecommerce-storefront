import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface AdminCrumb {
  label: string;
  /** Omit on the last crumb: it is the current page. */
  href?: string;
}

/**
 * Admin breadcrumb trail. Pass it to `<PageHeader breadcrumbs={...} />`.
 * Uses next/link (admin lives outside the [locale] segment).
 */
export function AdminBreadcrumbs({ items }: { items: AdminCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-admin-text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight aria-hidden className="w-3.5 h-3.5 shrink-0" />}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded hover:text-admin-text-secondary transition-colors focus-ring truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="font-medium text-admin-text-secondary truncate">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

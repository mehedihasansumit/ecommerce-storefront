"use client";

import { useCallback, useState } from "react";
import { ChevronDown, LayoutGrid, Shirt, SlidersHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BottomSheet, StoreImage } from "@/shared/components/ui";

export interface CategoryFilterItem {
  key: string;
  href: string;
  label: string;
  /** Category photo; empty shows a neutral icon tile instead. */
  image: string;
  /** Product count, already formatted for the locale. */
  count: string;
  active: boolean;
  /** The "All products" entry gets a grid icon. */
  isAll?: boolean;
}

interface CategoryFilterSheetProps {
  items: CategoryFilterItem[];
  /** Trigger text up to the value, e.g. "ক্যাটাগরি:". */
  prefix: string;
  /** The current category's name, shown in the brand colour. */
  current: string;
  title: string;
  closeLabel: string;
}

/**
 * Phone/tablet category picker for the Products page: one button that names the
 * current category and opens a bottom sheet listing every category with its photo
 * and product count. Each row is a plain link, so filtering stays server-rendered.
 */
export function CategoryFilterSheet({ items, prefix, current, title, closeLabel }: CategoryFilterSheetProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  // On open, centre the current category in the sheet's list so a long list never
  // hides it. Measured as a difference of two rects, so the sheet's slide-up
  // transform (applied to both) doesn't skew the result.
  const showCurrent = useCallback((list: HTMLUListElement | null) => {
    const scroller = list?.parentElement;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!scroller || !current) return;
    const offset = current.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    scroller.scrollTop += offset - (scroller.clientHeight - current.offsetHeight) / 2;
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="focus-ring flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 border border-input-border bg-[var(--color-card-bg)] px-3 text-sm text-[var(--color-text)] transition-colors duration-150 hover:border-text-secondary"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <span className="flex min-w-0 items-center gap-2">
          <SlidersHorizontal size={16} aria-hidden className="shrink-0 text-text-tertiary" />
          {/* Read aloud, not shown: the filter icon + chevron already say "pick a category",
              and the room goes to long names like "বিয়ের শেরওয়ানি". */}
          <span className="sr-only">{prefix}</span>
          <span className="truncate font-semibold" style={{ color: "var(--color-link)" }}>
            {current}
          </span>
        </span>
        <ChevronDown size={16} aria-hidden className="shrink-0 text-text-tertiary" />
      </button>

      <BottomSheet open={open} onClose={close} title={title} closeLabel={closeLabel}>
        <ul ref={showCurrent} className="-mx-3 -mt-2 space-y-0.5">
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                onClick={close}
                aria-current={item.active ? "page" : undefined}
                className="focus-ring grid min-h-14 grid-cols-[2.5rem_1fr_auto_1.25rem] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-surface"
                style={
                  item.active
                    ? { backgroundColor: "color-mix(in srgb, var(--color-primary) 7%, transparent)" }
                    : undefined
                }
              >
                <span
                  aria-hidden
                  className="relative grid size-10 place-items-center overflow-hidden rounded-lg bg-surface text-text-tertiary"
                >
                  {item.isAll ? (
                    <LayoutGrid size={18} />
                  ) : item.image ? (
                    <StoreImage src={item.image} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    <Shirt size={18} />
                  )}
                </span>
                <span
                  className={`min-w-0 line-clamp-2 break-words text-[15px] leading-snug ${item.active ? "font-semibold" : ""}`}
                  style={item.active ? { color: "var(--color-link)" } : undefined}
                >
                  {item.label}
                </span>
                <span className="text-xs tabular-nums text-text-tertiary">{item.count}</span>
                {/* Radio-style marker; the link's aria-current carries the state. */}
                <span
                  aria-hidden
                  className="grid size-5 place-items-center rounded-full border-[1.5px]"
                  style={{ borderColor: item.active ? "var(--color-primary)" : "var(--color-border-subtle)" }}
                >
                  {item.active && (
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}

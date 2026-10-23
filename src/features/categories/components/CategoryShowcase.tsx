import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton, SkeletonText, StoreImage } from "@/shared/components/ui";
import { getCategoryLayout, type CategoryLayout, type CategoryPhoneLayout } from "../layout";
import { CategoryMarquee, CategoryMarqueeRow, CategoryMarqueeToggle } from "./CategoryMarquee";
import { CategoryMarqueeSkeletonRow } from "./CategoryMarqueeSkeleton";
import { MARQUEE_ITEM, MARQUEE_STATIC, marqueeNameLines } from "./marquee-classes";

export interface CategoryShowcaseItem {
  id: string;
  href: string;
  name: string;
  image: string;
  /** Localized "3 pieces" line under the name (tablet/desktop only). */
  meta: string;
}

interface CategoryShowcaseProps {
  title: string;
  items: CategoryShowcaseItem[];
  viewAllHref: string;
  viewAllLabel: string;
}

// Static class maps so Tailwind sees every class. The phone layout comes from
// getCategoryLayout(); from 640px every mode becomes a centred, wrapping row whose
// tile width is derived from --cols (so a shorter last row never leaves a gap).
const PHONE_LIST: Record<CategoryPhoneLayout, string> = {
  "grid-3": "grid grid-cols-3 gap-x-3 gap-y-4",
  "grid-2": "grid grid-cols-2 gap-x-3 gap-y-4",
  scroll: "flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-px-4 no-scrollbar",
};
// ~3.5 tiles visible: 100vw minus the 1rem left gutter and three 0.75rem gaps.
const PHONE_SCROLL_ITEM = "shrink-0 snap-start w-[calc((100vw-1rem-2.25rem)/3.5)]";
const DESKTOP_LIST =
  "sm:flex sm:flex-wrap sm:justify-center sm:gap-4 sm:overflow-visible sm:snap-none";
const DESKTOP_ITEM = "sm:shrink-0 sm:w-[calc((100%-(var(--cols)-1)*1rem)/var(--cols))] sm:max-w-56";
// Small counts keep the variant's compact horizontal "collection" cards from md up.
const ROW_COLS: Record<number, string> = {
  1: "md:grid-cols-2",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

/**
 * Home "Shop by Category". The layout adapts to how many categories the store
 * has (rules live in getCategoryLayout). Colours, radius and display face come
 * from the tenant theme tokens.
 */
/** List + item classes for a layout; shared by the showcase and its skeleton. */
function showcaseClasses(layout: CategoryLayout) {
  const rowCards = layout.desktopRowCards;
  const listClass = [
    "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1",
    PHONE_LIST[layout.phone],
    DESKTOP_LIST,
    rowCards ? `md:grid md:gap-4 lg:gap-5 ${ROW_COLS[layout.desktopCount]}` : "",
  ].join(" ");

  const itemClass = (i: number) =>
    [
      layout.phone === "scroll" ? PHONE_SCROLL_ITEM : "min-w-0",
      DESKTOP_ITEM,
      rowCards ? "md:w-auto md:max-w-none" : "",
      i >= layout.phoneCount ? "hidden sm:block" : "",
      i >= layout.desktopCount ? "sm:hidden" : "",
    ].join(" ");

  return { listClass, itemClass, listStyle: { "--cols": layout.desktopCols } as CSSProperties };
}

const MARQUEE_ID = "home-categories-marquee";
const HEADER_ROW =
  "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 mb-2 md:mb-5";

export function CategoryShowcase({ title, items, viewAllHref, viewAllLabel }: CategoryShowcaseProps) {
  if (items.length === 0) return null;
  const layout = getCategoryLayout(items.length);
  const rowCards = layout.desktopRowCards;
  const rendered = items.slice(0, Math.max(layout.phoneCount, layout.desktopCount));
  const { listClass, itemClass, listStyle } = showcaseClasses(layout);

  const viewAll = (
    <Link
      href={viewAllHref}
      className="focus-ring shrink-0 inline-flex items-center gap-1 min-h-11 px-1 text-sm font-medium rounded-lg"
      style={{ color: "var(--color-link)" }}
    >
      {viewAllLabel}
      <ArrowRight size={14} aria-hidden />
    </Link>
  );
  const heading = (
    <h2 id="shop-by-category" className="text-lg md:text-2xl font-semibold tracking-tight">
      {title}
    </h2>
  );
  const staticList = (
    <ul className={listClass} style={listStyle}>
      {rendered.map((item, i) => (
        <li key={item.id} className={itemClass(i)}>
          <CategoryCard item={item} row={rowCards} />
        </li>
      ))}
      {layout.viewAllTile && (
        <li className={itemClass(0)}>
          <ViewAllTile href={viewAllHref} label={viewAllLabel} />
        </li>
      )}
    </ul>
  );

  if (!layout.marquee) {
    return (
      <section aria-labelledby="shop-by-category" className="py-4 md:py-8">
        <div className={HEADER_ROW}>
          {heading}
          {viewAll}
        </div>
        {staticList}
      </section>
    );
  }

  // >= MARQUEE_MIN: one moving row; the static layout above is the reduced-motion fallback.
  return (
    <section aria-labelledby="shop-by-category" className="py-4 md:py-8">
      <CategoryMarquee>
        <div className={HEADER_ROW}>
          {heading}
          <div className="flex shrink-0 items-center gap-1">
            <CategoryMarqueeToggle controls={MARQUEE_ID} />
            {viewAll}
          </div>
        </div>
        <div className={MARQUEE_STATIC}>{staticList}</div>
        <CategoryMarqueeRow id={MARQUEE_ID} className="max-w-7xl mx-auto">
          {items.slice(0, layout.marqueeCount).map((item) => (
            <li key={item.id} className={MARQUEE_ITEM}>
              <CategoryCard item={item} row={false} />
            </li>
          ))}
          {layout.viewAllTile && (
            <li className={MARQUEE_ITEM}>
              <ViewAllTile href={viewAllHref} label={viewAllLabel} />
            </li>
          )}
        </CategoryMarqueeRow>
      </CategoryMarquee>
    </section>
  );
}

const TILE_LINK =
  "focus-ring group flex h-full min-h-11 flex-col gap-2 transition-transform duration-150 ease-(--ease-out-expo) active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
const TILE_NAME =
  "font-display text-[15px] sm:text-base leading-snug text-text line-clamp-2 break-words underline decoration-transparent decoration-1 underline-offset-[5px] transition-colors duration-200 group-hover:decoration-current";

/** No photo: a framed plaque in the theme colour, not an empty box. */
function Plaque({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: "color-mix(in srgb, var(--color-primary) 7%, var(--color-surface))" }}
    >
      <span
        className="absolute inset-1.5 border"
        style={{
          borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
          borderRadius: "calc(var(--border-radius) - 2px)",
        }}
      />
      {children}
    </span>
  );
}

function CategoryCard({ item, row }: { item: CategoryShowcaseItem; row: boolean }) {
  const initial = item.name.trim().charAt(0);
  return (
    <Link
      href={item.href}
      className={`${TILE_LINK} ${
        row
          ? "md:flex-row md:items-center md:gap-4 lg:gap-5 md:p-2 md:pr-4 lg:pr-5 md:border md:border-border-subtle md:bg-[var(--color-card-bg,var(--color-bg))] md:transition-[transform,border-color] md:hover:border-[color-mix(in_srgb,var(--color-primary)_45%,var(--color-border-subtle))]"
          : ""
      }`}
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <span
        className={`relative block w-full aspect-square shrink-0 overflow-hidden bg-surface ${
          row ? "md:w-20 lg:w-28" : ""
        }`}
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {item.image ? (
          <StoreImage
            src={item.image}
            alt=""
            fill
            sizes={row ? "(max-width: 767px) 33vw, (max-width: 1023px) 80px, 112px" : "(max-width: 639px) 33vw, 224px"}
            className="media-dim object-cover transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <Plaque>
            <span className="flex flex-col items-center gap-1.5">
              <span
                className={`font-display italic leading-none text-4xl sm:text-5xl ${row ? "md:text-4xl lg:text-5xl" : ""}`}
                style={{ color: "var(--color-primary)" }}
              >
                {initial}
              </span>
              <span
                className="block h-px w-5"
                style={{ background: "color-mix(in srgb, var(--color-primary) 55%, transparent)" }}
              />
            </span>
          </Plaque>
        )}
      </span>

      <span className={`flex min-w-0 flex-1 items-start gap-3 ${row ? "md:items-center" : ""}`}>
        <span className="min-w-0 flex-1">
          <span className={`${TILE_NAME} ${row ? "md:text-lg lg:text-[22px] md:leading-tight" : "md:text-lg"}`}>
            {item.name}
          </span>
          {/* Phones show image + name only; the count line returns from 640px. */}
          <span className="mt-0.5 hidden sm:flex items-center gap-1 text-xs tracking-wide text-text-secondary">
            {item.meta}
            <ArrowRight
              size={12}
              aria-hidden
              className={`transition-transform duration-200 ease-(--ease-out-expo) group-hover:translate-x-0.5 ${row ? "lg:hidden" : ""}`}
            />
          </span>
        </span>
        {row && (
          <span
            aria-hidden
            className="hidden lg:flex size-10 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-text)_28%,transparent)] text-text transition-colors duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-bg"
          >
            <ArrowRight
              size={16}
              className="transition-transform duration-200 ease-(--ease-out-expo) group-hover:translate-x-0.5"
            />
          </span>
        )}
      </span>
    </Link>
  );
}

function ViewAllTile({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={TILE_LINK} style={{ borderRadius: "var(--border-radius)" }}>
      <span
        className="relative block w-full aspect-square overflow-hidden bg-surface"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <Plaque>
          <span
            className="flex size-11 items-center justify-center rounded-full border"
            style={{
              color: "var(--color-primary)",
              borderColor: "color-mix(in srgb, var(--color-primary) 55%, transparent)",
            }}
          >
            <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </Plaque>
      </span>
      <span className={`${TILE_NAME} md:text-lg`}>{label}</span>
    </Link>
  );
}

/**
 * Loading state for CategoryShowcase. Pass the real category count so the same
 * layout (grid / snap row / row cards) is reserved and nothing jumps on swap.
 */
export function CategoryShowcaseSkeleton({
  count,
  longestName = 0,
}: {
  count: number;
  /** Characters in the longest category name: phone tiles (~13 chars a line) wrap past 12. */
  longestName?: number;
}) {
  if (count <= 0) return null;
  const layout = getCategoryLayout(count);
  const row = layout.desktopRowCards;
  const tiles = Math.max(layout.phoneCount, layout.desktopCount) + (layout.viewAllTile ? 1 : 0);
  const { listClass, itemClass, listStyle } = showcaseClasses(layout);

  const tile = (rowCards: boolean, { lines, lastLineClassName }: { lines: number; lastLineClassName: string }) => (
    <div
      className={`flex h-full min-h-11 flex-col gap-2 ${
        rowCards
          ? "md:flex-row md:items-center md:gap-4 lg:gap-5 md:p-2 md:pr-4 lg:pr-5 md:border md:border-border-subtle md:bg-[var(--color-card-bg,var(--color-bg))]"
          : ""
      }`}
      style={{ borderRadius: "var(--border-radius)" }}
    >
      <Skeleton className={`w-full aspect-square shrink-0 ${rowCards ? "md:w-20 lg:w-28" : ""}`} />
      <div className="min-w-0 flex-1">
        <SkeletonText
          className={`text-[15px] sm:text-base leading-snug ${rowCards ? "md:text-lg lg:text-[22px] md:leading-tight" : "md:text-lg"}`}
          width="w-4/5"
          lines={lines}
          lastWidth="w-1/2"
          lastLineClassName={lastLineClassName}
        />
        <SkeletonText className="mt-0.5 hidden sm:block text-xs" width="w-14" />
      </div>
    </div>
  );

  const staticList = (
    <ul className={listClass} style={listStyle}>
      {Array.from({ length: tiles }).map((_, i) => (
        <li key={i} className={layout.viewAllTile && i === tiles - 1 ? itemClass(0) : itemClass(i)}>
          {tile(row, { lines: longestName > 12 ? 2 : 1, lastLineClassName: "sm:hidden" })}
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-hidden className="py-4 md:py-8">
      <div className={HEADER_ROW}>
        <SkeletonText className="text-lg md:text-2xl" width="w-36 md:w-48" />
        <div className={`min-h-11 flex items-center ${layout.marquee ? "shrink-0 gap-1" : ""}`}>
          {layout.marquee && <Skeleton radius="lg" className="size-11 motion-reduce:hidden" />}
          <SkeletonText className="text-sm" width="w-16" />
        </div>
      </div>
      {layout.marquee ? (
        <>
          <div className={MARQUEE_STATIC}>{staticList}</div>
          <CategoryMarqueeSkeletonRow className="max-w-7xl mx-auto">
            {Array.from({ length: layout.marqueeCount + (layout.viewAllTile ? 1 : 0) }).map((_, i) => (
              <li key={i} className={MARQUEE_ITEM}>
                {tile(false, marqueeNameLines(longestName, [12, 16, 20]))}
              </li>
            ))}
          </CategoryMarqueeSkeletonRow>
        </>
      ) : (
        staticList
      )}
    </section>
  );
}

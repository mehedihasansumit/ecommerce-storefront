import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton, SkeletonText, StoreImage } from "@/shared/components/ui";
import type { CategoryShowcaseItem } from "./CategoryShowcase";
import { CategoryScrollRow } from "./CategoryScrollRow";
import { SCROLL_LIST, SCROLL_TILE } from "./scroll-row-classes";
import { firstGrapheme } from "./monogram";
import { getCategoryLayout } from "../layout";
import { CategoryMarquee, CategoryMarqueeRow, CategoryMarqueeToggle } from "./CategoryMarquee";
import { CategoryMarqueeSkeletonRow } from "./CategoryMarqueeSkeleton";
import { CategoryScrollButtons } from "./CategoryScrollButtons";
import { MARQUEE_ITEM, MARQUEE_STATIC, marqueeNameLines } from "./marquee-classes";

// categoryStyle "scroll-row" (from the taste-skill Variant): a quiet grid while few,
// a snap row with prev/next once there are 7 or more. Server component; only the
// scroll row's buttons are client code. From MARQUEE_MIN categories the row moves by
// itself (CategoryMarqueeRow); the snap row stays as the reduced-motion fallback.

interface ScrollRowShowcaseProps {
  title: string;
  items: CategoryShowcaseItem[];
  viewAllHref: string;
  viewAllLabel: string;
  locale: string;
}

type Mode = "row" | "grid-2" | "grid-3" | "scroll";

/** 1–3 one row (wide cards from 768px), 4 as 2×2 on phones, 5–6 three columns, 7+ snap row (8 + "View all" past 12). */
function layoutFor(n: number): { mode: Mode; visible: number; viewAllTile: boolean } {
  if (n <= 3) return { mode: "row", visible: n, viewAllTile: false };
  if (n === 4) return { mode: "grid-2", visible: 4, viewAllTile: false };
  if (n <= 6) return { mode: "grid-3", visible: n, viewAllTile: false };
  if (n <= 12) return { mode: "scroll", visible: n, viewAllTile: false };
  return { mode: "scroll", visible: 8, viewAllTile: true };
}

const PHONE_GRID: Record<Exclude<Mode, "scroll">, string> = {
  row: "grid-cols-3",
  "grid-2": "grid-cols-2",
  "grid-3": "grid-cols-3",
};
const GRID_LIST =
  "grid gap-x-3 gap-y-5 sm:gap-4 lg:gap-6 sm:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]";
const SECTION = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16";
const HEADING = "text-2xl md:text-4xl font-medium tracking-[-0.03em] leading-tight";
const LINK_BASE =
  "focus-ring group flex h-full min-h-11 flex-col gap-2 sm:gap-2.5 transition-transform duration-150 ease-(--ease-out-expo) active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100";
/** Up to three categories become wide picture-and-name cards from 768px up. */
const LINK_WIDE_ROW =
  "md:flex-row md:items-center md:gap-4 lg:gap-5 md:p-3 md:bg-surface md:transition-[background-color,transform] md:hover:bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]";
const MEDIA = "relative block aspect-square w-full shrink-0 overflow-hidden bg-surface";
const MEDIA_WIDE_ROW = "md:w-20 lg:w-28 md:aspect-[4/5] md:bg-bg";
const NAME = "line-clamp-2 text-sm sm:text-[15px] font-medium leading-snug tracking-[-0.01em]";
const NAME_WIDE_ROW = "md:text-lg lg:text-xl md:tracking-[-0.02em]";
const MARQUEE_ID = "home-categories-marquee";
const STATIC_ID = "home-categories-list";
const HEAD_ROW = "flex items-center justify-between gap-4 mb-5 md:mb-8";
/** The marquee bleeds out of the section's gutter; its sets put the gutter back. */
const MARQUEE_BLEED = "-mx-4 sm:-mx-6 lg:-mx-8";

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="focus-ring group shrink-0 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-medium rounded-lg"
      style={{ color: "var(--color-link)" }}
    >
      {label}
      <ArrowRight
        size={16}
        aria-hidden
        className="transition-transform duration-150 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:transition-none"
      />
    </Link>
  );
}

export function ScrollRowShowcase({ title, items, viewAllHref, viewAllLabel, locale }: ScrollRowShowcaseProps) {
  if (items.length === 0) return null;
  const layout = layoutFor(items.length);
  const isScroll = layout.mode === "scroll";
  const wideRow = layout.mode === "row";
  const radius = { borderRadius: "var(--border-radius)" };
  const mediaRadius = { borderRadius: "calc(var(--border-radius) * 0.75)" };

  const tile = (item: CategoryShowcaseItem, liClass: string) => (
    <li key={item.id} className={liClass}>
      <Link href={item.href} className={`${LINK_BASE} ${wideRow ? LINK_WIDE_ROW : ""}`} style={radius}>
        <span className={`${MEDIA} ${wideRow ? MEDIA_WIDE_ROW : ""}`} style={mediaRadius}>
          {item.image ? (
            <StoreImage
              src={item.image}
              alt=""
              fill
              sizes="(max-width: 639px) 34vw, (max-width: 1023px) 22vw, 220px"
              className="media-dim object-cover transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-[1.05] motion-reduce:transition-none"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 flex items-center justify-center text-4xl sm:text-5xl font-medium tracking-[-0.04em] text-text-secondary"
            >
              {firstGrapheme(item.name, locale)}
            </span>
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
          <span
            className={`${NAME} underline-offset-4 decoration-1 group-hover:underline ${wideRow ? NAME_WIDE_ROW : "md:text-base"}`}
          >
            {item.name}
          </span>
          <span className="hidden sm:flex items-center gap-1.5 whitespace-nowrap text-[13px] md:text-sm text-text-secondary">
            {item.meta}
            {wideRow && (
              <ArrowRight
                size={14}
                aria-hidden
                className="shrink-0 transition-transform duration-150 ease-(--ease-out-expo) group-hover:translate-x-1 motion-reduce:transition-none"
              />
            )}
          </span>
        </span>
      </Link>
    </li>
  );
  const tiles = items.slice(0, layout.visible).map((item) => tile(item, isScroll ? SCROLL_TILE : "min-w-0"));
  const viewAllTile = (liClass: string) => (
    <li className={liClass}>
      <Link href={viewAllHref} className={LINK_BASE} style={radius}>
        <span
          className="flex aspect-square w-full items-center justify-center bg-surface transition-colors duration-150 group-hover:bg-[color-mix(in_srgb,var(--color-text)_6%,var(--color-surface))]"
          style={{ ...mediaRadius, color: "var(--color-link)" }}
        >
          <ArrowRight size={28} aria-hidden className="transition-transform duration-150 group-hover:translate-x-1" />
        </span>
        <span className={`${NAME} md:text-base`} style={{ color: "var(--color-link)" }}>
          {viewAllLabel}
        </span>
      </Link>
    </li>
  );

  const heading = (
    <h2 id="shop-by-category" className={HEADING}>
      {title}
    </h2>
  );

  const marquee = getCategoryLayout(items.length);
  if (marquee.marquee) {
    // The snap row (with its prev/next) is the reduced-motion fallback.
    return (
      <section aria-labelledby="shop-by-category" className={SECTION}>
        <CategoryMarquee>
          <div className={HEAD_ROW}>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
              {heading}
              <ViewAll href={viewAllHref} label={viewAllLabel} />
            </div>
            <div className="hidden sm:motion-reduce:block">
              <CategoryScrollButtons targetId={STATIC_ID} />
            </div>
            <CategoryMarqueeToggle controls={MARQUEE_ID} />
          </div>
          <div className={MARQUEE_STATIC}>
            <ul id={STATIC_ID} aria-label={title} className={SCROLL_LIST}>
              {tiles}
              {layout.viewAllTile && viewAllTile(SCROLL_TILE)}
            </ul>
          </div>
          <CategoryMarqueeRow id={MARQUEE_ID} className={MARQUEE_BLEED}>
            {items.slice(0, marquee.marqueeCount).map((item) => tile(item, MARQUEE_ITEM))}
            {marquee.viewAllTile && viewAllTile(MARQUEE_ITEM)}
          </CategoryMarqueeRow>
        </CategoryMarquee>
      </section>
    );
  }

  if (isScroll) {
    return (
      <section aria-labelledby="shop-by-category" className={SECTION}>
        <CategoryScrollRow
          label={title}
          header={
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
              {heading}
              <ViewAll href={viewAllHref} label={viewAllLabel} />
            </div>
          }
        >
          {tiles}
          {layout.viewAllTile && viewAllTile(SCROLL_TILE)}
        </CategoryScrollRow>
      </section>
    );
  }

  return (
    <section aria-labelledby="shop-by-category" className={SECTION}>
      <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-8">
        {heading}
        <ViewAll href={viewAllHref} label={viewAllLabel} />
      </div>
      <ul
        style={{ "--cols": layout.visible } as CSSProperties}
        className={`${GRID_LIST} ${PHONE_GRID[layout.mode as Exclude<Mode, "scroll">]}`}
      >
        {tiles}
      </ul>
    </section>
  );
}

/** Loading state: same mode, same tile geometry. */
export function ScrollRowShowcaseSkeleton({ count, longestName = 0 }: { count: number; longestName?: number }) {
  if (count <= 0) return null;
  const layout = layoutFor(count);
  const isScroll = layout.mode === "scroll";
  const wideRow = layout.mode === "row";
  const n = layout.visible + (layout.viewAllTile ? 1 : 0);
  const tileBody = (nameLines?: { lines: number; lastLineClassName: string }) => (
      <div
        className={`flex h-full min-h-11 flex-col gap-2 sm:gap-2.5 ${wideRow ? "md:flex-row md:items-center md:gap-4 lg:gap-5 md:p-3 md:bg-surface" : ""}`}
        style={{ borderRadius: "var(--border-radius)" }}
      >
        <Skeleton className={`aspect-square w-full shrink-0 ${wideRow ? "md:w-20 lg:w-28 md:aspect-[4/5]" : ""}`} />
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:gap-1.5">
          <SkeletonText
            className={`${NAME} ${wideRow ? NAME_WIDE_ROW : "md:text-base"}`}
            width="w-4/5"
            lines={nameLines?.lines}
            lastWidth="w-1/2"
            lastLineClassName={nameLines?.lastLineClassName}
          />
          <SkeletonText className="hidden sm:block text-[13px] md:text-sm" width="w-14" />
        </div>
      </div>
  );
  const tile = (i: number) => (
    <li key={i} className={isScroll ? SCROLL_TILE : "min-w-0"}>
      {tileBody()}
    </li>
  );
  const head = (
    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-4">
      <SkeletonText className={HEADING} width="w-48 md:w-72" />
      <div className="min-h-11 flex items-center">
        <SkeletonText className="text-[15px]" width="w-16" />
      </div>
    </div>
  );
  const marquee = getCategoryLayout(count);
  if (marquee.marquee) {
    return (
      <section aria-hidden className={SECTION}>
        <div className={HEAD_ROW}>
          {head}
          <div className="hidden sm:motion-reduce:flex shrink-0 items-center gap-2">
            <Skeleton radius="lg" className="size-10" />
            <Skeleton radius="lg" className="size-10" />
          </div>
          <Skeleton radius="lg" className="size-11 shrink-0 motion-reduce:hidden" />
        </div>
        <div className={MARQUEE_STATIC}>
          <ul className={SCROLL_LIST}>{Array.from({ length: n }).map((_, i) => tile(i))}</ul>
        </div>
        <CategoryMarqueeSkeletonRow className={MARQUEE_BLEED}>
          {Array.from({ length: marquee.marqueeCount + (marquee.viewAllTile ? 1 : 0) }).map((_, i) => (
            <li key={i} className={MARQUEE_ITEM}>
              {tileBody(marqueeNameLines(longestName, [13, 19, 25]))}
            </li>
          ))}
        </CategoryMarqueeSkeletonRow>
      </section>
    );
  }
  return (
    <section aria-hidden className={SECTION}>
      {isScroll ? (
        <>
          <div className="flex items-center justify-between gap-4 mb-5 md:mb-8">
            {head}
            <div className="hidden sm:flex shrink-0 items-center gap-2">
              <Skeleton radius="lg" className="size-11" />
              <Skeleton radius="lg" className="size-11" />
            </div>
          </div>
          <ul className={SCROLL_LIST}>{Array.from({ length: n }).map((_, i) => tile(i))}</ul>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-4 mb-5 md:mb-8">{head}</div>
          <ul
            style={{ "--cols": layout.visible } as CSSProperties}
            className={`${GRID_LIST} ${PHONE_GRID[layout.mode as Exclude<Mode, "scroll">]}`}
          >
            {Array.from({ length: n }).map((_, i) => tile(i))}
          </ul>
        </>
      )}
    </section>
  );
}

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton, SkeletonText, StoreImage } from "@/shared/components/ui";
import type { CategoryShowcaseItem } from "./CategoryShowcase";
import { firstGrapheme } from "./monogram";
import { getCategoryLayout } from "../layout";
import { CategoryMarquee, CategoryMarqueeRow, CategoryMarqueeToggle } from "./CategoryMarquee";
import { CategoryMarqueeSkeletonRow } from "./CategoryMarqueeSkeleton";
import { MARQUEE_ITEM, MARQUEE_STATIC, marqueeNameLines } from "./marquee-classes";

// categoryStyle "plates" (from the impeccable Variant): photographs as plates with an
// inset accent hairline, the hero's frame in miniature. Server-safe (the marquee,
// from MARQUEE_MIN categories, is a client island; the grid below is its
// reduced-motion fallback).

interface PlateShowcaseProps {
  title: string;
  description: string;
  items: CategoryShowcaseItem[];
  viewAllHref: string;
  viewAllLabel: string;
  locale: string;
  /** The Store's theme.motion.categories (default on): auto-scroll from MARQUEE_MIN. */
  autoScroll?: boolean;
}

const PHONE_LIST = {
  "grid-3": "grid grid-cols-3 gap-3",
  "grid-2": "grid grid-cols-2 gap-3",
  scroll:
    "flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory no-scrollbar -mx-4 px-4 scroll-px-4",
} as const;
const PHONE_SCROLL_ITEM = "snap-start shrink-0 w-[calc((100vw-3.25rem)/3.5)]";
/** Up to this many plates in one row, the heading sits beside them from md up. */
const MAX_BESIDE = 4;
const TILE_LINK =
  "focus-ring group block transition-transform duration-150 ease-(--ease-out-expo) motion-safe:active:scale-[0.98]";
const TILE_NAME =
  "mt-2 sm:mt-2.5 font-display text-[0.9rem] sm:text-[0.95rem] md:text-base leading-snug line-clamp-2 break-words underline decoration-1 underline-offset-[5px] decoration-transparent transition-colors duration-150 group-hover:decoration-accent";

/**
 * Count rules. Phones: 1–3 one row of 3, 4 as 2×2, 5–6 three columns, 7+ a peeking
 * snap row (first 8 + "View all" past 12). From 640px: up to 6 in one row of 4:5
 * plates; 7–12 two balanced rows (a shorter second row is centred); past 12 the first
 * 11 + a "View all" plate.
 */
function geometry(count: number) {
  const overflow = count > 12;
  const phone = count === 4 ? "grid-2" : count <= 6 ? "grid-3" : "scroll";
  const phoneVisible = overflow ? 8 : count;
  const wideVisible = overflow ? 11 : count;
  const slots = wideVisible + (overflow ? 1 : 0);
  const rows = slots <= 6 ? 1 : 2;
  const cols = rows === 1 ? Math.max(1, slots) : Math.ceil(slots / 2);
  const beside = rows === 1 && cols <= MAX_BESIDE;
  // Two rows with an odd slot count: run the grid on half-columns and start the
  // second row's first plate one half in, so the short row is centred.
  const offsetIndex = rows === 2 && slots % 2 === 1 ? cols : -1;

  const plate = `relative block aspect-square overflow-hidden bg-surface ${rows === 1 ? "sm:aspect-[4/5]" : ""}`;
  const wideList = beside
    ? "sm:grid-cols-[repeat(var(--half-cols),minmax(0,1fr))] md:grid-cols-[repeat(var(--half-cols),minmax(0,6rem))]"
    : "sm:grid-cols-[repeat(var(--half-cols),minmax(0,1fr))]";
  return {
    overflow,
    phoneVisible,
    wideVisible,
    plate,
    listStyle: { "--half-cols": cols * 2 } as CSSProperties,
    listClass: `${PHONE_LIST[phone]} sm:mx-0 sm:px-0 sm:overflow-visible sm:grid sm:gap-4 lg:gap-5 ${wideList}`,
    itemBase: `${phone === "scroll" ? PHONE_SCROLL_ITEM : "min-w-0"} sm:w-auto sm:col-span-2`,
    offsetStyle: (i: number): CSSProperties | undefined => (i === offsetIndex ? { gridColumnStart: 2 } : undefined),
    sectionClass: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${
      beside ? "md:grid md:grid-cols-[minmax(12rem,1fr)_auto] md:gap-8 lg:gap-12" : ""
    }`,
    headClass: `flex items-center sm:items-baseline justify-between gap-4 mb-4 ${
      beside ? "md:self-stretch md:flex-col md:items-start md:justify-between md:mb-0" : "md:mb-7"
    }`,
    viewAllClass: beside ? "md:-mb-2" : "",
  };
}

const MARQUEE_ID = "home-categories-marquee";
/** The marquee bleeds out of the section's gutter; its sets put the gutter back. */
const MARQUEE_BLEED = "-mx-4 sm:-mx-6 lg:-mx-8";

function visibility(i: number, g: ReturnType<typeof geometry>) {
  return `${i >= g.phoneVisible ? "hidden sm:block" : ""} ${i >= g.wideVisible ? "sm:hidden" : ""}`;
}

function PlateFrame() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-1 sm:inset-1.5 md:inset-2 border opacity-60 transition-opacity duration-300 ease-(--ease-out-expo) group-hover:opacity-100"
      style={{ borderColor: "color-mix(in srgb, var(--color-accent) 70%, transparent)" }}
    />
  );
}

export function PlateShowcase({ title, description, items, viewAllHref, viewAllLabel, locale, autoScroll = true }: PlateShowcaseProps) {
  if (items.length === 0) return null;
  const g = geometry(items.length);
  const rendered = items.slice(0, Math.max(g.phoneVisible, g.wideVisible));

  const marquee = getCategoryLayout(items.length, autoScroll);

  const plateLink = (href: string, children: ReactNode, name: ReactNode) => (
    <Link href={href} className={TILE_LINK}>
      <span className={g.plate} style={{ borderRadius: "var(--border-radius)" }}>
        {children}
        <PlateFrame />
      </span>
      {name}
    </Link>
  );
  const itemTile = (item: CategoryShowcaseItem) =>
    plateLink(
      item.href,
      item.image ? (
        <StoreImage
          src={item.image}
          alt=""
          fill
          sizes="(min-width: 640px) 200px, 46vw"
          className="plate-photo object-cover transition-[transform,filter] duration-700 ease-(--ease-out-expo) group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-4xl sm:text-5xl md:text-6xl leading-none text-primary"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 40%, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 90%, var(--color-accent)) 100%)",
          }}
        >
          {firstGrapheme(item.name, locale)}
        </span>
      ),
      <span className="flex items-start justify-between gap-2">
        <span className={TILE_NAME}>{item.name}</span>
        <ArrowRight
          size={15}
          aria-hidden
          className="hidden sm:block mt-[0.85em] shrink-0 text-text-secondary transition-[transform,color] duration-300 ease-(--ease-out-expo) group-hover:translate-x-1 group-hover:text-primary"
        />
      </span>
    );
  const viewAllTile = () =>
    plateLink(
      viewAllHref,
      <span className="absolute inset-0 flex items-center justify-center text-primary">
        <ArrowRight
          aria-hidden
          strokeWidth={1.5}
          className="size-7 md:size-9 transition-transform duration-300 ease-(--ease-out-expo) group-hover:translate-x-1"
        />
      </span>,
      <span className={`block ${TILE_NAME}`}>{viewAllLabel}</span>
    );

  const viewAll = (
    <Link
      href={viewAllHref}
      className={`focus-ring shrink-0 inline-flex items-center gap-1.5 min-h-11 text-sm font-medium rounded-lg underline decoration-accent decoration-1 underline-offset-[6px] hover:text-primary transition-colors ${g.viewAllClass}`}
    >
      {viewAllLabel}
      <ArrowRight size={14} aria-hidden />
    </Link>
  );
  const headingBlock = (
    <div className="min-w-0">
      <h2 id="shop-by-category" className="text-2xl md:text-[2rem] leading-tight text-balance">
        {title}
      </h2>
      <p className="hidden sm:block mt-1.5 text-sm md:text-base text-text-secondary">{description}</p>
    </div>
  );
  const staticList = (
    <ul className={g.listClass} style={g.listStyle}>
      {rendered.map((item, i) => (
        <li key={item.id} className={`${g.itemBase} ${visibility(i, g)}`} style={g.offsetStyle(i)}>
          {itemTile(item)}
        </li>
      ))}
      {g.overflow && (
        <li className={g.itemBase} style={g.offsetStyle(g.wideVisible)}>
          {viewAllTile()}
        </li>
      )}
    </ul>
  );

  if (!marquee.marquee) {
    return (
      <section aria-labelledby="shop-by-category" className={g.sectionClass}>
        <div className={g.headClass}>
          {headingBlock}
          {viewAll}
        </div>
        {staticList}
      </section>
    );
  }

  return (
    <section aria-labelledby="shop-by-category" className={g.sectionClass}>
      <CategoryMarquee>
        <div className={g.headClass}>
          {headingBlock}
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            <CategoryMarqueeToggle controls={MARQUEE_ID} />
            {viewAll}
          </div>
        </div>
        <div className={MARQUEE_STATIC}>{staticList}</div>
        <CategoryMarqueeRow id={MARQUEE_ID} className={MARQUEE_BLEED}>
          {items.slice(0, marquee.marqueeCount).map((item) => (
            <li key={item.id} className={MARQUEE_ITEM}>
              {itemTile(item)}
            </li>
          ))}
          {marquee.viewAllTile && <li className={MARQUEE_ITEM}>{viewAllTile()}</li>}
        </CategoryMarqueeRow>
      </CategoryMarquee>
    </section>
  );
}

/** Loading state with the same count-driven geometry. */
export function PlateShowcaseSkeleton({
  count,
  longestName = 0,
  autoScroll = true,
}: {
  count: number;
  longestName?: number;
  autoScroll?: boolean;
}) {
  if (count <= 0) return null;
  const g = geometry(count);
  const tiles = Math.max(g.phoneVisible, g.wideVisible);
  const tile = (
    <>
      <Skeleton className={g.plate.replace("bg-surface", "")} />
      <SkeletonText className={`${TILE_NAME} no-underline sm:pe-6`} width="w-4/5" lines={longestName > 14 ? 2 : 1} lastWidth="w-1/2" lastLineClassName="sm:hidden" />
    </>
  );
  const marquee = getCategoryLayout(count, autoScroll);
  const staticList = (
    <ul className={g.listClass} style={g.listStyle}>
      {Array.from({ length: tiles }).map((_, i) => (
        <li key={i} className={`${g.itemBase} ${visibility(i, g)}`} style={g.offsetStyle(i)}>
          {tile}
        </li>
      ))}
      {g.overflow && (
        <li className={g.itemBase} style={g.offsetStyle(g.wideVisible)}>
          {tile}
        </li>
      )}
    </ul>
  );
  const nameLines = marqueeNameLines(longestName, [14, 22, 28]);
  const marqueeTile = (
    <>
      <Skeleton className={g.plate.replace("bg-surface", "")} />
      <SkeletonText
        className={`${TILE_NAME} no-underline sm:pe-6`}
        width="w-4/5"
        lines={nameLines.lines}
        lastWidth="w-1/2"
        lastLineClassName={nameLines.lastLineClassName}
      />
    </>
  );
  return (
    <section aria-hidden className={g.sectionClass}>
      <div className={g.headClass}>
        <div className="min-w-0">
          <SkeletonText className="text-2xl md:text-[2rem] leading-tight" width="w-44 md:w-56" />
          <SkeletonText className="hidden sm:block mt-1.5 text-sm md:text-base" width="w-52" />
        </div>
        {marquee.marquee ? (
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            <Skeleton radius="lg" className="size-11 motion-reduce:hidden" />
            <div className={`flex items-center min-h-11 ${g.viewAllClass}`}>
              <SkeletonText className="text-sm" width="w-16" />
            </div>
          </div>
        ) : (
          <div className={`shrink-0 flex items-center min-h-11 ${g.viewAllClass}`}>
            <SkeletonText className="text-sm" width="w-16" />
          </div>
        )}
      </div>
      {marquee.marquee ? (
        <>
          <div className={MARQUEE_STATIC}>{staticList}</div>
          <CategoryMarqueeSkeletonRow className={MARQUEE_BLEED}>
            {Array.from({ length: marquee.marqueeCount + (marquee.viewAllTile ? 1 : 0) }).map((_, i) => (
              <li key={i} className={MARQUEE_ITEM}>
                {marqueeTile}
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

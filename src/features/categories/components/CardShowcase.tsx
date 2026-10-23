import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton, SkeletonText, StoreImage } from "@/shared/components/ui";
import type { CategoryShowcaseItem } from "./CategoryShowcase";
import { CategoryScrollButtons } from "./CategoryScrollButtons";
import { firstGrapheme } from "./monogram";
import { getCategoryLayout } from "../layout";
import { CategoryMarquee, CategoryMarqueeRow, CategoryMarqueeToggle } from "./CategoryMarquee";
import { CategoryMarqueeSkeletonRow } from "./CategoryMarqueeSkeleton";
import { MARQUEE_ITEM, MARQUEE_STATIC, marqueeNameLines } from "./marquee-classes";

// categoryStyle "cards" (from the frontend-design Variant): large image cards with the
// name and count underneath. Geometry lives in globals.css (.cat-list / .cat-tile),
// keyed by data-phone / data-wide, so the skeleton reuses it exactly. Server-safe.
// From MARQUEE_MIN categories the row moves by itself (CategoryMarqueeRow, a client
// island); the scroll row with prev/next stays as the reduced-motion fallback.

interface CardShowcaseProps {
  title: string;
  items: CategoryShowcaseItem[];
  viewAllHref: string;
  viewAllLabel: string;
  locale: string;
}

const LIST_ID = "home-categories-list";
const MARQUEE_ID = "home-categories-marquee";

/**
 * Phones: 1–3 one row of 3, 4 as 2×2, 5–6 three columns, 7+ a ~3.5-tile snap row.
 * From 640px: up to 6 in one row (1–3 as landscape cards), 7+ a scroll row with
 * prev/next. Past 12: the first 8 + a "View all" tile.
 */
function layoutFor(n: number) {
  const wide = n <= 6 ? "row" : "scroll";
  if (n > 12) return { phone: "scroll", wide, shown: 8, viewAllTile: true } as const;
  const phone = n === 4 ? "grid-2" : n <= 6 ? "grid-3" : "scroll";
  return { phone, wide, shown: n, viewAllTile: false } as const;
}

function Frame({
  title,
  viewAllHref,
  viewAllLabel,
  layout,
  children,
  marqueeRow,
  skeleton = false,
}: {
  title: ReactNode;
  viewAllHref: string;
  viewAllLabel: ReactNode;
  layout: ReturnType<typeof layoutFor>;
  children: ReactNode;
  /** The moving row (count >= MARQUEE_MIN); the list above is then the reduced-motion fallback. */
  marqueeRow?: ReactNode;
  skeleton?: boolean;
}) {
  const marquee = marqueeRow != null;
  const scrollButtons = layout.wide === "scroll" && !skeleton && <CategoryScrollButtons targetId={LIST_ID} />;
  const list = (
    <ul
      id={skeleton ? undefined : LIST_ID}
      className="cat-list max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 no-scrollbar"
      data-phone={layout.phone}
      data-wide={layout.wide}
      data-few={layout.wide === "row" && layout.shown <= 3 ? "" : undefined}
      style={{ "--cat-n": layout.shown } as CSSProperties}
    >
      {children}
    </ul>
  );
  const content = (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 md:mb-6 flex items-center justify-between gap-4">
        {title}
        <div className="flex shrink-0 items-center gap-4">
          {marquee ? (
            <>
              {scrollButtons && <div className="hidden sm:motion-reduce:block">{scrollButtons}</div>}
              {skeleton ? (
                <Skeleton radius="lg" className="size-11 motion-reduce:hidden" />
              ) : (
                <CategoryMarqueeToggle controls={MARQUEE_ID} />
              )}
            </>
          ) : (
            scrollButtons
          )}
          {skeleton ? (
            viewAllLabel
          ) : (
            <Link
              href={viewAllHref}
              className="focus-ring inline-flex min-h-10 items-center gap-1 text-sm font-medium rounded-lg"
              style={{ color: "var(--color-link)" }}
            >
              {viewAllLabel}
              <ArrowRight size={14} aria-hidden />
            </Link>
          )}
        </div>
      </div>
      {marquee ? (
        <>
          <div className={MARQUEE_STATIC}>{list}</div>
          {marqueeRow}
        </>
      ) : (
        list
      )}
    </>
  );
  return (
    <section aria-labelledby={skeleton ? undefined : "shop-by-category"} aria-hidden={skeleton || undefined} className="py-4 md:py-8">
      {marquee && !skeleton ? <CategoryMarquee>{content}</CategoryMarquee> : content}
    </section>
  );
}

export function CardShowcase({ title, items, viewAllHref, viewAllLabel, locale }: CardShowcaseProps) {
  if (items.length === 0) return null;
  const layout = layoutFor(items.length);
  const wideCols = layout.wide === "row" ? layout.shown : 6.5;
  const sizes = `(max-width: 639px) 34vw, (max-width: 1279px) ${Math.ceil(100 / Math.min(wideCols, 4.5))}vw, ${Math.ceil(1216 / wideCols)}px`;

  const marquee = getCategoryLayout(items.length);
  const itemTile = (item: CategoryShowcaseItem, liClass: string, tileSizes: string) => (
    <li key={item.id} className={liClass}>
      <Link href={item.href} className="cat-tile focus-ring group">
        <span className="cat-tile-media" aria-hidden>
          {item.image ? (
            <StoreImage
              src={item.image}
              alt=""
              fill
              sizes={tileSizes}
              className="media-dim object-cover transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span className="cat-tile-monogram font-display">{firstGrapheme(item.name, locale)}</span>
          )}
        </span>
        <span className="cat-tile-text">
          <span className="cat-tile-name font-display">{item.name}</span>
          <span className="cat-tile-count">{item.meta}</span>
        </span>
      </Link>
    </li>
  );
  const viewAllTile = (liClass: string) => (
    <li className={liClass}>
      <Link href={viewAllHref} className="cat-tile focus-ring group">
        <span className="cat-tile-media" aria-hidden>
          <span className="cat-tile-monogram">
            <ArrowRight size={28} aria-hidden />
          </span>
        </span>
        <span className="cat-tile-text">
          <span className="cat-tile-name font-display">{viewAllLabel}</span>
        </span>
      </Link>
    </li>
  );
  const marqueeItem = `cat-item ${MARQUEE_ITEM}`;

  return (
    <Frame
      layout={layout}
      viewAllHref={viewAllHref}
      viewAllLabel={viewAllLabel}
      marqueeRow={
        marquee.marquee ? (
          <CategoryMarqueeRow id={MARQUEE_ID} className="max-w-7xl mx-auto">
            {items
              .slice(0, marquee.marqueeCount)
              .map((item) => itemTile(item, marqueeItem, "(max-width: 639px) 104px, (max-width: 1023px) 160px, 208px"))}
            {marquee.viewAllTile && viewAllTile(marqueeItem)}
          </CategoryMarqueeRow>
        ) : undefined
      }
      title={
        <h2 id="shop-by-category" className="text-xl md:text-3xl font-semibold tracking-tight">
          {title}
        </h2>
      }
    >
      {items.slice(0, layout.shown).map((item) => itemTile(item, "cat-item", sizes))}
      {layout.viewAllTile && viewAllTile("cat-item")}
    </Frame>
  );
}

/** Loading state: the same .cat-list geometry and heading row. */
export function CardShowcaseSkeleton({ count, longestName = 0 }: { count: number; longestName?: number }) {
  if (count <= 0) return null;
  const layout = layoutFor(count);
  const tiles = layout.shown + (layout.viewAllTile ? 1 : 0);
  const marquee = getCategoryLayout(count);
  const tile = (nameLines?: { lines: number; lastLineClassName: string }) => (
    <span className="cat-tile">
      <span className="cat-tile-media">
        <Skeleton radius="none" className="absolute inset-0" />
      </span>
      <span className="cat-tile-text">
        <SkeletonText
          className="cat-tile-name"
          width="w-4/5"
          lines={nameLines?.lines}
          lastWidth="w-1/2"
          lastLineClassName={nameLines?.lastLineClassName}
        />
        <SkeletonText className="cat-tile-count" width="w-14" />
      </span>
    </span>
  );
  return (
    <Frame
      skeleton
      marqueeRow={
        marquee.marquee ? (
          <CategoryMarqueeSkeletonRow className="max-w-7xl mx-auto">
            {Array.from({ length: marquee.marqueeCount + (marquee.viewAllTile ? 1 : 0) }).map((_, i) => (
              <li key={i} className={`cat-item ${MARQUEE_ITEM}`}>
                {tile(marqueeNameLines(longestName, [13, 18, 19]))}
              </li>
            ))}
          </CategoryMarqueeSkeletonRow>
        ) : undefined
      }
      layout={layout}
      viewAllHref=""
      viewAllLabel={
        <div className="min-h-10 flex items-center">
          <SkeletonText className="text-sm" width="w-16" />
        </div>
      }
      title={<SkeletonText className="text-xl md:text-3xl" width="w-44 md:w-64" />}
    >
      {Array.from({ length: tiles }).map((_, i) => (
        <li key={i} className="cat-item">
          {tile()}
        </li>
      ))}
    </Frame>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Marquee, MarqueeRow, MarqueeStatic, MarqueeToggle } from "@/shared/components/storefront/Marquee";
import type { IProduct } from "../types";
import { ProductCard } from "./ProductCard";

interface ProductRailProps {
  title: string;
  products: IProduct[];
  viewAllHref?: string;
  viewAllLabel?: string;
  /**
   * Auto-scroll the rail left to right (home New Arrivals; the caller decides with
   * newArrivalsMarquee, ../layout.ts). `pauseLabel` names the Pause/Play toggle.
   */
  marquee?: { id: string; pauseLabel: string };
}

const HEADER_ROW =
  "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between gap-4 mb-3 md:mb-6";
/** Card width: ~44vw on phones so the next one peeks in, 240px from md. */
const CARD = "shrink-0 w-[44vw] max-w-60 md:w-60";

/**
 * Horizontal swipe rail (native scroll-snap). Cards are ~44vw on phones so the next
 * one peeks in — a cue that the row scrolls. Widens to fixed-width cards on desktop.
 *
 * With `marquee` the same cards move left to right by themselves (the shared
 * storefront Marquee); the swipe rail is then the reduced-motion fallback. Cards keep
 * their widths and the toggle does not grow the header row, so the marquee is exactly
 * as tall as the rail and ProductRailSkeleton fits both.
 */
export function ProductRail({ title, products, viewAllHref, viewAllLabel, marquee }: ProductRailProps) {
  if (products.length === 0) return null;
  const viewAll = viewAllHref && viewAllLabel && (
    <Link
      href={viewAllHref}
      className="focus-ring shrink-0 inline-flex items-center gap-1 text-sm font-medium rounded-lg"
      style={{ color: "var(--color-primary)" }}
    >
      {viewAllLabel}
      <ArrowRight size={14} aria-hidden />
    </Link>
  );
  const heading = <h2 className="text-lg md:text-2xl font-semibold tracking-tight">{title}</h2>;
  const rail = (
    <div
      role="region"
      aria-label={title}
      tabIndex={0}
      className="focus-ring max-w-7xl mx-auto flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 lg:scroll-px-8 px-4 sm:px-6 lg:px-8 pb-2 no-scrollbar"
    >
      {products.map((p) => (
        <div key={p._id} className={`snap-start ${CARD}`}>
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );

  if (!marquee) {
    return (
      <section className="py-4 md:py-8">
        <div className={`${HEADER_ROW} items-baseline`}>
          {heading}
          {viewAll}
        </div>
        {rail}
      </section>
    );
  }

  return (
    <section className="py-4 md:py-8">
      <Marquee>
        <div className={`${HEADER_ROW} items-center`}>
          {heading}
          <div className="flex shrink-0 items-center gap-1">
            {/* 44px target; the negative margin keeps the row as tall as the heading. */}
            <MarqueeToggle controls={marquee.id} label={marquee.pauseLabel} className="-my-2 md:-my-1.5" />
            {viewAll}
          </div>
        </div>
        <MarqueeStatic>{rail}</MarqueeStatic>
        <MarqueeRow id={marquee.id} direction="ltr" className="max-w-7xl mx-auto">
          {products.map((p) => (
            <li key={p._id} className={CARD}>
              <ProductCard product={p} />
            </li>
          ))}
        </MarqueeRow>
      </Marquee>
    </section>
  );
}

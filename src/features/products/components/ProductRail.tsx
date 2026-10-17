import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { IProduct } from "../types";
import { ProductCard } from "./ProductCard";

interface ProductRailProps {
  title: string;
  products: IProduct[];
  viewAllHref?: string;
  viewAllLabel?: string;
}

/**
 * Horizontal swipe rail (native scroll-snap). Cards are ~44vw on phones so the next
 * one peeks in — a cue that the row scrolls. Widens to fixed-width cards on desktop.
 */
export function ProductRail({ title, products, viewAllHref, viewAllLabel }: ProductRailProps) {
  if (products.length === 0) return null;
  return (
    <section className="py-4 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between gap-4 mb-3 md:mb-6">
        <h2 className="text-lg md:text-2xl font-semibold tracking-tight">{title}</h2>
        {viewAllHref && viewAllLabel && (
          <Link
            href={viewAllHref}
            className="focus-ring shrink-0 inline-flex items-center gap-1 text-sm font-medium rounded-lg"
            style={{ color: "var(--color-primary)" }}
          >
            {viewAllLabel}
            <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
      <div
        role="region"
        aria-label={title}
        tabIndex={0}
        className="focus-ring max-w-7xl mx-auto flex gap-3 md:gap-5 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 lg:scroll-px-8 px-4 sm:px-6 lg:px-8 pb-2 no-scrollbar"
      >
        {products.map((p) => (
          <div key={p._id} className="snap-start shrink-0 w-[44vw] max-w-60 md:w-60">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

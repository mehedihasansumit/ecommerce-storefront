"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui";
import { SCROLL_LIST } from "./scroll-row-classes";

interface CategoryScrollRowProps {
  /** The section's header row content (title + "View all"); the buttons sit beside it. */
  header: ReactNode;
  /** Accessible name of the scrolling list. */
  label: string;
  children: ReactNode;
}

/**
 * Snap-scrolling row of category tiles. Swipe on a phone; from 640px up a prev/next
 * pair pages through it a screenful at a time and disables itself at either end.
 * Children are `<li>` tiles sized with SCROLL_TILE. Not used by the default home layout
 * yet: it is the "scroll" option of the categoryStyle Style Switch.
 */
export function CategoryScrollRow({ header, label, children }: CategoryScrollRowProps) {
  const t = useTranslations("home");
  const listRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = listRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-5 md:mb-8">
        {header}
        <div className="hidden sm:flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="size-11 justify-center"
            aria-label={t("categoriesPrev")}
            disabled={atStart}
            onClick={() => page(-1)}
          >
            <ChevronLeft size={20} aria-hidden />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-11 justify-center"
            aria-label={t("categoriesNext")}
            disabled={atEnd}
            onClick={() => page(1)}
          >
            <ChevronRight size={20} aria-hidden />
          </Button>
        </div>
      </div>
      <ul
        ref={listRef}
        aria-label={label}
        className={SCROLL_LIST}
      >
        {children}
      </ul>
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui";

/**
 * Prev/next for a wide-screen category scroll row that lives elsewhere in the DOM
 * (phones swipe; the buttons are hidden there). Each press pages by most of the
 * visible width so one tile stays in view as an anchor.
 */
export function CategoryScrollButtons({ targetId }: { targetId: string }) {
  const t = useTranslations("home");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    setAtStart(pos <= 2);
    setAtEnd(pos + el.clientWidth >= el.scrollWidth - 2);
  }, [targetId]);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    // ResizeObserver also fires once on observe(), which sets the initial state.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, [targetId, sync]);

  const page = (dir: 1 | -1) => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Button
        variant="secondary"
        size="icon"
        className="size-10 justify-center"
        aria-label={t("categoriesPrev")}
        aria-controls={targetId}
        disabled={atStart}
        onClick={() => page(-1)}
      >
        <ChevronLeft size={18} aria-hidden />
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className="size-10 justify-center"
        aria-label={t("categoriesNext")}
        aria-controls={targetId}
        disabled={atEnd}
        onClick={() => page(1)}
      >
        <ChevronRight size={18} aria-hidden />
      </Button>
    </div>
  );
}

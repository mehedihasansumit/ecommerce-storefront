"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui";
import { MARQUEE_SET, MARQUEE_VIEWPORT } from "./marquee-classes";

// The home "Shop by Category" marquee (count >= MARQUEE_MIN, see ../layout.ts).
//
// - The list is rendered twice in a track that a CSS keyframe moves from 0 to -50%,
//   so the loop is seamless. The duration is set from the measured width of one set
//   (ResizeObserver), so the speed stays ~SPEED px/s whatever the tile count.
// - The server renders the track paused at 0; motion starts after mount, only when
//   motion is allowed. Under prefers-reduced-motion CSS hides the marquee (and the
//   toggle) and shows the style's static layout instead, so nothing shifts.
// - Hover, focus inside and touch pause it; it resumes RESUME_MS after the last of
//   them ends. The Pause toggle (WCAG 2.2.2) wins over all of that until pressed again.
// - Off-screen sections and hidden tabs pause it too.
// - Touch: the viewport is a real (scrollbar-less) overflow-x scroller. On touchstart
//   the current animated offset is baked into scrollLeft and the animation removed,
//   so the finger scrolls natively; scrollLeft wraps by one set to stay infinite.
//   When the interaction ends the scroll offset is turned back into a negative
//   animation-delay, so motion resumes from where the visitor left it. Keyboard
//   focus does the same hand-over (then scrolls the focused real tile into view),
//   because the transform can carry a tile past the edge where scrolling can't reach.

const SPEED = 35; // px per second
const RESUME_MS = 2500;

interface MarqueeState {
  paused: boolean;
  setPaused: (paused: boolean) => void;
}

const MarqueeContext = createContext<MarqueeState | null>(null);

/** Shares the visitor's Pause/Play choice between the header toggle and the row. */
export function CategoryMarquee({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <MarqueeContext.Provider value={{ paused, setPaused }}>{children}</MarqueeContext.Provider>;
}

/** Pause/Play for the moving row. Hidden (with the motion) under reduced motion. */
export function CategoryMarqueeToggle({ controls }: { controls: string }) {
  const ctx = useContext(MarqueeContext);
  const t = useTranslations("home");
  if (!ctx) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="cat-marquee-toggle size-11 shrink-0 motion-reduce:hidden"
      aria-label={t("categoriesPause")}
      aria-pressed={ctx.paused}
      aria-controls={controls}
      onClick={() => ctx.setPaused(!ctx.paused)}
    >
      {ctx.paused ? (
        <Play size={18} strokeWidth={1.75} className="translate-x-px" aria-hidden />
      ) : (
        <Pause size={18} strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}

interface CategoryMarqueeRowProps {
  id: string;
  /** Extra classes for the viewport (e.g. a negative margin to bleed out of a padded section). */
  className?: string;
  /** Extra classes for each set (`<ul>`). */
  setClassName?: string;
  /** The `<li>` tiles of one set. */
  children: ReactNode;
}

/** The moving row: one real list, one aria-hidden + inert copy right after it. */
export function CategoryMarqueeRow({ id, className = "", setClassName = "", children }: CategoryMarqueeRowProps) {
  const paused = useContext(MarqueeContext)?.paused ?? false;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const applyRef = useRef<() => void>(() => {});

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const set = track?.firstElementChild as HTMLElement | null | undefined;
    if (!viewport || !track || !set) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let setWidth = 0;
    let duration = 0;
    let hover = false;
    let focus = false;
    let touching = false;
    let interacting = false;
    let manual = false;
    let offscreen = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const apply = () => {
      const run =
        !reduce.matches &&
        duration > 0 &&
        setWidth > viewport.clientWidth &&
        !manual &&
        !interacting &&
        !offscreen &&
        !document.hidden &&
        !pausedRef.current;
      track.toggleAttribute("data-running", run);
    };
    applyRef.current = apply;

    const mod = (x: number) => (setWidth > 0 ? ((x % setWidth) + setWidth) % setWidth : 0);
    /** Distance the row has travelled within one set, from the animation (or the manual scroll). */
    const offset = () => {
      if (manual) return mod(viewport.scrollLeft);
      const tx = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      return mod(viewport.scrollLeft - tx);
    };
    /** Restart the keyframe so that it starts `px` into the set. */
    const startAt = (px: number) => {
      track.style.setProperty("--marquee-delay", `${duration > 0 ? -(px / setWidth) * duration : 0}s`);
      track.style.animation = "none";
      void track.offsetWidth; // flush, so the next line starts a fresh animation
      track.style.animation = "";
    };

    const enterManual = () => {
      if (manual || setWidth <= 0) return;
      // Keep the raw position (not modulo one set): when focus scrolled a tile into
      // view, the window must stay on that real tile, not on its inert copy.
      const max = viewport.scrollWidth - viewport.clientWidth;
      let px = viewport.scrollLeft - new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      if (px > max) px -= setWidth;
      if (px < 0) px += setWidth;
      manual = true;
      track.setAttribute("data-manual", "");
      viewport.scrollLeft = px;
    };
    const exitManual = () => {
      if (!manual) return;
      const px = mod(viewport.scrollLeft);
      manual = false;
      track.removeAttribute("data-manual");
      viewport.scrollLeft = 0;
      startAt(px);
    };

    const scheduleResume = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hover || focus || touching) return;
        interacting = false;
        exitManual();
        apply();
      }, RESUME_MS);
    };
    const hold = () => {
      clearTimeout(timer);
      interacting = true;
      apply();
    };

    const measure = () => {
      const next = set.offsetWidth;
      if (next === setWidth) return apply();
      const fraction = setWidth > 0 ? offset() / setWidth : 0;
      const wasMeasured = setWidth > 0;
      setWidth = next;
      duration = setWidth / SPEED;
      track.style.setProperty("--marquee-duration", `${duration}s`);
      if (manual) viewport.scrollLeft = fraction * setWidth;
      else if (wasMeasured) startAt(fraction * setWidth);
      apply();
    };

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hover = true;
      hold();
    };
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      hover = false;
      scheduleResume();
    };
    const onFocusIn = (e: FocusEvent) => {
      focus = true;
      hold();
      // The transform can carry a real tile past the left edge, where scrolling
      // cannot reach it: bake the offset into scrollLeft first, then reveal the tile.
      enterManual();
      // Keyboard focus only: a mouse press must not move the tile under the pointer.
      if (e.target instanceof HTMLElement && e.target.matches(":focus-visible")) {
        e.target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.relatedTarget instanceof Node && viewport.contains(e.relatedTarget)) return;
      focus = false;
      scheduleResume();
    };
    const onTouchStart = () => {
      touching = true;
      enterManual();
      hold();
    };
    const onTouchEnd = () => {
      touching = false;
      scheduleResume();
    };
    const onScroll = () => {
      if (!manual) {
        // A trackpad swipe or a focused tile scrolled into view: hand over to manual.
        if (viewport.scrollLeft === 0) return;
        enterManual();
        hold();
      } else if (!focus && setWidth > 0) {
        // Wrap by one set so a swipe never reaches either end. The window is
        // [1, setWidth + 1), so a wrapped position never triggers the opposite wrap.
        // Not while a tile has focus: the real tile must stay in view, and every real
        // tile is reachable without wrapping.
        const x = viewport.scrollLeft;
        if (x < 1) viewport.scrollLeft = x + setWidth;
        else if (x >= setWidth + 1) viewport.scrollLeft = x - setWidth;
      }
      // Momentum keeps scrolling after the finger lifts: wait for it to settle.
      if (!hover && !focus && !touching) scheduleResume();
    };

    const ro = new ResizeObserver(measure);
    ro.observe(set);
    ro.observe(viewport);
    const io = new IntersectionObserver(([entry]) => {
      offscreen = !entry.isIntersecting;
      apply();
    });
    io.observe(viewport);

    viewport.addEventListener("pointerenter", onPointerEnter);
    viewport.addEventListener("pointerleave", onPointerLeave);
    viewport.addEventListener("focusin", onFocusIn);
    viewport.addEventListener("focusout", onFocusOut);
    viewport.addEventListener("touchstart", onTouchStart, { passive: true });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });
    viewport.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", apply);
    reduce.addEventListener("change", apply);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      io.disconnect();
      viewport.removeEventListener("pointerenter", onPointerEnter);
      viewport.removeEventListener("pointerleave", onPointerLeave);
      viewport.removeEventListener("focusin", onFocusIn);
      viewport.removeEventListener("focusout", onFocusOut);
      viewport.removeEventListener("touchstart", onTouchStart);
      viewport.removeEventListener("touchend", onTouchEnd);
      viewport.removeEventListener("touchcancel", onTouchEnd);
      viewport.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", apply);
      reduce.removeEventListener("change", apply);
      applyRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    applyRef.current();
  }, [paused]);

  return (
    <div ref={viewportRef} id={id} className={`${MARQUEE_VIEWPORT} ${className}`}>
      <div ref={trackRef} className="cat-marquee-track">
        <ul className={`${MARQUEE_SET} ${setClassName}`}>{children}</ul>
        <ul className={`${MARQUEE_SET} ${setClassName}`} aria-hidden="true" inert>
          {children}
        </ul>
      </div>
    </div>
  );
}

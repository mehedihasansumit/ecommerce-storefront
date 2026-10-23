"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/shared/components/ui";
import { MARQUEE_SET, MARQUEE_STATIC, MARQUEE_VIEWPORT } from "./marquee-classes";

// A storefront marquee: one row of items that moves by itself, for the home
// "Shop by Category" (right to left) and "New Arrivals" (left to right) sections.
//
// Pieces (compose them in the section):
//   <Marquee>                      shares the visitor's Pause/Play choice
//     <MarqueeToggle label=… />    the WCAG 2.2.2 pause control (place it in the header)
//     <MarqueeStatic>…</…>         the section's normal layout, shown under reduced motion
//     <MarqueeRow direction=…>     the moving row: one set of <li> items
//   </Marquee>
//
// - The items are rendered twice in a track that a CSS keyframe moves from 0 to -50%
//   ("rtl": items travel leftwards) or, played in reverse, from -50% to 0 ("ltr":
//   items travel rightwards), so the loop is seamless. The duration is set from the
//   measured width of one set (ResizeObserver), so the speed stays `speed` px/s
//   whatever the item count. The copy is aria-hidden and inert.
// - The server renders the track paused; motion starts after mount, only when motion
//   is allowed. Under prefers-reduced-motion CSS hides the row (and the toggle) and
//   shows MarqueeStatic instead, so nothing shifts and nothing mismatches.
// - Hover, focus inside and touch pause it; it resumes RESUME_MS after the last of
//   them ends. The Pause toggle wins over all of that until pressed again.
// - Off-screen rows and hidden tabs pause it too.
// - Touch: the viewport is a real (scrollbar-less) overflow-x scroller. On touchstart
//   the current animated offset is baked into scrollLeft and the animation removed,
//   so the finger scrolls natively; scrollLeft wraps by one set to stay infinite.
//   When the interaction ends the scroll offset is turned back into a negative
//   animation-delay, so motion resumes from where the visitor left it. Keyboard
//   focus does the same hand-over (then scrolls the focused real item into view),
//   because the transform can carry an item past the edge where scrolling can't reach.

export type MarqueeDirection = "rtl" | "ltr";

/** Default speed in px per second. */
export const MARQUEE_SPEED = 35;
const RESUME_MS = 2500;

interface MarqueeState {
  paused: boolean;
  setPaused: (paused: boolean) => void;
}

const MarqueeContext = createContext<MarqueeState | null>(null);

/** Shares the visitor's Pause/Play choice between the toggle and the row. */
export function Marquee({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return <MarqueeContext.Provider value={{ paused, setPaused }}>{children}</MarqueeContext.Provider>;
}

/** Pause/Play for the moving row (aria-pressed). Hidden, with the motion, under reduced motion. */
export function MarqueeToggle({
  controls,
  label,
  className = "",
}: {
  /** id of the MarqueeRow it controls. */
  controls: string;
  /** Translated accessible name, e.g. "Pause category carousel". */
  label: string;
  className?: string;
}) {
  const ctx = useContext(MarqueeContext);
  if (!ctx) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`marquee-toggle size-11 shrink-0 motion-reduce:hidden ${className}`}
      aria-label={label}
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

/** The section's normal (non-moving) layout: shown only under reduced motion. */
export function MarqueeStatic({ children }: { children: ReactNode }) {
  return <div className={MARQUEE_STATIC}>{children}</div>;
}

interface MarqueeRowProps {
  id: string;
  /** "rtl": items travel right to left (default). "ltr": items travel left to right. */
  direction?: MarqueeDirection;
  /** px per second. */
  speed?: number;
  /** Extra classes for the viewport (e.g. a negative margin to bleed out of a padded section). */
  className?: string;
  /** Extra classes for each set (`<ul>`). */
  setClassName?: string;
  /** The `<li>` items of one set. */
  children: ReactNode;
}

/** The moving row: one real list, one aria-hidden + inert copy right after it. */
export function MarqueeRow({
  id,
  direction = "rtl",
  speed = MARQUEE_SPEED,
  className = "",
  setClassName = "",
  children,
}: MarqueeRowProps) {
  const paused = useContext(MarqueeContext)?.paused ?? false;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useMarquee({ viewportRef, trackRef, paused, direction, speed });

  return (
    <div ref={viewportRef} id={id} className={`${MARQUEE_VIEWPORT} ${className}`}>
      <div ref={trackRef} className="marquee-track" data-direction={direction}>
        <ul className={`${MARQUEE_SET} ${setClassName}`}>{children}</ul>
        <ul className={`${MARQUEE_SET} ${setClassName}`} aria-hidden="true" inert>
          {children}
        </ul>
      </div>
    </div>
  );
}

/**
 * Drives a marquee track (`.marquee-track` holding two identical sets) inside a
 * scrollable viewport: speed, pausing, touch/keyboard hand-over. See the notes at
 * the top of this file.
 */
export function useMarquee({
  viewportRef,
  trackRef,
  paused,
  direction,
  speed,
}: {
  viewportRef: RefObject<HTMLElement | null>;
  trackRef: RefObject<HTMLElement | null>;
  paused: boolean;
  direction: MarqueeDirection;
  speed: number;
}) {
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
    /** Where the window's left edge is within one set, from the animation (or the manual scroll). */
    const offset = () => {
      if (manual) return mod(viewport.scrollLeft);
      const tx = new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
      return mod(viewport.scrollLeft - tx);
    };
    /**
     * Restart the keyframe so that the window starts `px` into the set. "rtl" plays
     * 0 → -50% (progress p shows px = p·set); "ltr" plays it reversed (px = (1 - p)·set).
     */
    const startAt = (px: number) => {
      const p = setWidth > 0 ? px / setWidth : 0;
      const progress = direction === "ltr" ? (1 - p) % 1 : p;
      track.style.setProperty("--marquee-delay", `${duration > 0 ? -progress * duration : 0}s`);
      track.style.animation = "none";
      void track.offsetWidth; // flush, so the next line starts a fresh animation
      track.style.animation = "";
    };

    const enterManual = () => {
      if (manual || setWidth <= 0) return;
      // Keep the raw position (not modulo one set): when focus scrolled an item into
      // view, the window must stay on that real item, not on its inert copy.
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
      duration = setWidth / speed;
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
      // The transform can carry a real item past the left edge, where scrolling
      // cannot reach it: bake the offset into scrollLeft first, then reveal the item.
      enterManual();
      // Keyboard focus only: a mouse press must not move the item under the pointer.
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
        // A trackpad swipe or a focused item scrolled into view: hand over to manual.
        if (viewport.scrollLeft === 0) return;
        enterManual();
        hold();
      } else if (!focus && setWidth > 0) {
        // Wrap by one set so a swipe never reaches either end. The window is
        // [1, setWidth + 1), so a wrapped position never triggers the opposite wrap.
        // Not while an item has focus: the real item must stay in view, and every real
        // item is reachable without wrapping.
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
    const io = new IntersectionObserver((entries) => {
      // Entries are in time order; a quick scroll away and back can batch both.
      offscreen = !entries[entries.length - 1].isIntersecting;
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
  }, [viewportRef, trackRef, direction, speed]);

  useEffect(() => {
    pausedRef.current = paused;
    applyRef.current();
  }, [paused]);
}

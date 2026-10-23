"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui";

/**
 * Hero background-video playback preference, shared by every slide of a hero.
 *
 * - Decided only after `window.load` + idle, so the poster image (the banner's
 *   `image`) stays the LCP element and the mp4 never competes with it.
 * - `prefers-reduced-motion: reduce` or `Save-Data` → starts paused; the video is
 *   not even downloaded until the visitor presses Play.
 */
export function useHeroVideoPlayback(enabled: boolean) {
  const [state, setState] = useState({ decided: false, paused: true });

  useEffect(() => {
    if (!enabled) return;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const decide = () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      setState({ decided: true, paused: reduced || conn?.saveData === true });
    };
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(decide, { timeout: 1500 });
      } else {
        timeoutId = setTimeout(decide, 300);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) setState((s) => ({ ...s, paused: true }));
    };
    mq.addEventListener("change", onMotionChange);

    return () => {
      window.removeEventListener("load", schedule);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      mq.removeEventListener("change", onMotionChange);
    };
  }, [enabled]);

  const toggle = useCallback(
    () => setState((s) => ({ decided: true, paused: !s.paused })),
    []
  );

  return { ...state, toggle };
}

export type HeroVideoPlayback = ReturnType<typeof useHeroVideoPlayback>;

/**
 * Decorative, muted, looping background video laid over the poster image.
 * Fades in only once frames are actually playing (poster shown until then),
 * and pauses whenever the hero is off-screen or the tab is hidden.
 * Must be rendered inside a positioned container; fills it with object-cover.
 */
export function HeroVideo({
  src,
  playing,
  className,
}: {
  src: string;
  /** Desired state: preference allows it AND this slide is the active one. */
  playing: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [requested, setRequested] = useState(false);
  const [shown, setShown] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  // Attach the <video> (and start the download) only once playback is first wanted.
  if (playing && !requested) setRequested(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [requested]);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (playing && inView && tabVisible) {
      el.muted = true; // belt-and-braces: autoplay policies require muted
      el.play().catch(() => {
        /* autoplay refused → poster stays visible, nothing to do */
      });
    } else {
      el.pause();
    }
  }, [playing, inView, tabVisible, requested]);

  if (!requested) return null;

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      disablePictureInPicture
      disableRemotePlayback
      aria-hidden="true"
      tabIndex={-1}
      onPlaying={() => setShown(true)}
      className={`hero-video absolute inset-0 h-full w-full object-cover ${shown ? "is-shown" : ""} ${className ?? ""}`}
    />
  );
}

/** Visible, keyboard-accessible pause/play control (WCAG 2.2.2). */
export function HeroVideoToggle({
  playback,
  className,
}: {
  playback: HeroVideoPlayback;
  className?: string;
}) {
  const tr = useTranslations("heroBanner");
  if (!playback.decided) return null;
  const label = playback.paused ? tr("playVideo") : tr("pauseVideo");
  return (
    <Button
      variant="overlay"
      size="icon"
      onClick={playback.toggle}
      aria-label={label}
      title={label}
      className={`hero-video-toggle h-11 w-11 ${className ?? ""}`}
    >
      {playback.paused ? (
        <Play size={16} strokeWidth={1.75} className="translate-x-px" aria-hidden />
      ) : (
        <Pause size={16} strokeWidth={1.75} aria-hidden />
      )}
    </Button>
  );
}

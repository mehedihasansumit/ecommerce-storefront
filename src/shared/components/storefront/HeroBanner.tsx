"use client";

import Link from "next/link";
import type { IHeroBanner } from "@/features/stores/types";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { t } from "@/shared/lib/i18n";

const AUTO_ADVANCE_MS = 7000;
const SWIPE_THRESHOLD = 50;

export function HeroBanner({ banners }: { banners: IHeroBanner[] }) {
  const tr = useTranslations("heroBanner");
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textStage, setTextStage] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLElement>(null);

  const activeBanners = banners?.filter((b) => t(b.title, locale)) || [];

  const goTo = useCallback(
    (index: number, direction?: "next" | "prev") => {
      if (isTransitioning) return;
      setSlideDirection(direction ?? (index > current ? "next" : "prev"));
      setIsTransitioning(true);
      setTextStage(0);
      setCurrent(index);
      setProgress(0);
      setTimeout(() => {
        setIsTransitioning(false);
        setTimeout(() => setTextStage(1), 100);
        setTimeout(() => setTextStage(2), 280);
        setTimeout(() => setTextStage(3), 460);
      }, 500);
    },
    [isTransitioning, current]
  );

  const next = useCallback(() => {
    goTo((current + 1) % activeBanners.length, "next");
  }, [current, activeBanners.length, goTo]);

  const prev = useCallback(() => {
    goTo(
      (current - 1 + activeBanners.length) % activeBanners.length,
      "prev"
    );
  }, [current, activeBanners.length, goTo]);

  // Initial text reveal
  useEffect(() => {
    setTimeout(() => setTextStage(1), 400);
    setTimeout(() => setTextStage(2), 600);
    setTimeout(() => setTextStage(3), 800);
  }, []);

  // Auto-advance with progress
  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const interval = 50;
    const timer = setInterval(() => {
      setProgress((p) => {
        const n = p + (interval / AUTO_ADVANCE_MS) * 100;
        return n >= 100 ? 100 : n;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [isPaused, activeBanners.length, current]);

  useEffect(() => {
    if (progress >= 100) next();
  }, [progress, next]);

  // Keyboard navigation
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, activeBanners.length]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) next();
      else prev();
    }
    setIsPaused(false);
  };

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[current];
  const slideNum = String(current + 1).padStart(2, "0");
  const totalNum = String(activeBanners.length).padStart(2, "0");

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[32rem] md:h-[38rem] lg:h-[44rem] overflow-hidden bg-gray-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images with clip-path reveal */}
      {activeBanners.map((b, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-[800ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
          style={{
            clipPath:
              i === current
                ? "inset(0 0 0 0)"
                : slideDirection === "next"
                  ? "inset(0 0 0 100%)"
                  : "inset(0 100% 0 0)",
            zIndex: i === current ? 2 : 1,
          }}
        >
          {b.image && (
            <img
              src={b.image}
              alt={t(b.title, locale)}
              className={`w-full h-full object-cover transition-transform duration-[20s] ease-out ${
                i === current ? "scale-110" : "scale-100"
              }`}
            />
          )}
        </div>
      ))}

      {/* Overlay gradient — editorial style */}
      <div
        className="absolute inset-0 z-[3]"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%), linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
        }}
      />

      {/* Content — left-aligned, editorial layout */}
      <div className="absolute inset-0 z-[4] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            {/* Decorative line */}
            <div
              className="h-px w-12 mb-6 transition-all duration-700 ease-out"
              style={{
                backgroundColor: "var(--color-primary)",
                opacity: textStage >= 1 && !isTransitioning ? 1 : 0,
                transform:
                  textStage >= 1 && !isTransitioning
                    ? "scaleX(1)"
                    : "scaleX(0)",
                transformOrigin: "left",
              }}
            />

            {/* Title */}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-5 transition-all duration-700 ease-out"
              style={{
                opacity: textStage >= 1 && !isTransitioning ? 1 : 0,
                transform:
                  textStage >= 1 && !isTransitioning
                    ? "translateY(0)"
                    : "translateY(30px)",
              }}
            >
              {t(banner.title, locale)}
            </h1>

            {/* Subtitle */}
            {t(banner.subtitle, locale) && (
              <p
                className="text-base md:text-lg text-white/70 font-light mb-8 max-w-lg leading-relaxed transition-all duration-700 ease-out"
                style={{
                  opacity: textStage >= 2 && !isTransitioning ? 1 : 0,
                  transform:
                    textStage >= 2 && !isTransitioning
                      ? "translateY(0)"
                      : "translateY(24px)",
                }}
              >
                {t(banner.subtitle, locale)}
              </p>
            )}

            {/* CTA */}
            {banner.linkUrl && (
              <div
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: textStage >= 3 && !isTransitioning ? 1 : 0,
                  transform:
                    textStage >= 3 && !isTransitioning
                      ? "translateY(0)"
                      : "translateY(24px)",
                }}
              >
                <Link
                  href={banner.linkUrl}
                  className="group inline-flex items-center gap-3 text-white font-medium text-sm tracking-wide uppercase"
                >
                  <span
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/30 group-hover:border-white/60 group-hover:scale-110 transition-all duration-300"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                    }}
                  >
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </span>
                  <span className="relative">
                    {banner.linkText || tr("shopNow")}
                    <span
                      className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide counter — large faded number (right side) */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 right-6 sm:right-8 lg:right-12 z-[4] hidden md:flex items-end gap-3 text-white">
          <span className="text-5xl lg:text-6xl font-extralight tabular-nums leading-none opacity-90">
            {slideNum}
          </span>
          <div className="flex flex-col items-start gap-1 pb-2">
            <span className="text-xs text-white/40 tracking-widest uppercase">
              / {totalNum}
            </span>
          </div>
        </div>
      )}

      {/* Navigation arrows — minimal, bottom-left */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-8 left-6 sm:left-8 lg:left-12 z-[4] flex items-center gap-1">
          <button
            onClick={prev}
            className="p-2.5 text-white/60 hover:text-white transition-colors duration-200"
            aria-label="Previous banner"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button
            onClick={next}
            className="p-2.5 text-white/60 hover:text-white transition-colors duration-200"
            aria-label="Next banner"
          >
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Progress lines — bottom bar */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-[4] flex">
          {activeBanners.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/10">
              <div
                className="h-full transition-all ease-linear"
                style={{
                  width:
                    i === current
                      ? `${progress}%`
                      : i < current
                        ? "100%"
                        : "0%",
                  backgroundColor:
                    i === current
                      ? "var(--color-primary)"
                      : "rgba(255,255,255,0.25)",
                  transitionDuration: i === current ? "100ms" : "400ms",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import type { IHeroBanner, HeroLayoutStyle } from "@/features/stores/types";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { t } from "@/shared/lib/i18n";
import { StoreImage } from "@/shared/components/ui";

const AUTO_ADVANCE_MS = 7000;
const SWIPE_THRESHOLD = 50;

interface HeroBannerProps {
  banners: IHeroBanner[];
  layout?: HeroLayoutStyle;
  contained?: boolean;
  borderRadius?: string;
}

export function HeroBanner({
  banners,
  layout = "slider",
  contained = false,
  borderRadius,
}: HeroBannerProps) {
  const activeBanners = banners?.filter((b) => b.image) || [];

  if (activeBanners.length === 0) return null;

  const sectionStyle: React.CSSProperties | undefined = borderRadius
    ? { borderRadius }
    : undefined;

  let inner: React.ReactElement;
  if (layout === "grid") {
    inner = <GridLayout banners={activeBanners} sectionStyle={sectionStyle} />;
  } else if (layout === "image") {
    inner = <ImageOnlyLayout banners={activeBanners} sectionStyle={sectionStyle} />;
  } else {
    inner = (
      <RotatingLayout
        banners={activeBanners}
        layout={layout}
        sectionStyle={sectionStyle}
      />
    );
  }

  if (contained) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{inner}</div>;
  }
  return inner;
}

// ── Shared rotating layout (slider / split / centered / minimal) ──────────────

function RotatingLayout({
  banners,
  layout,
  sectionStyle,
}: {
  banners: IHeroBanner[];
  layout: HeroLayoutStyle;
  sectionStyle?: React.CSSProperties;
}) {
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

  // Only slides that have been shown get their <img> rendered, so off-screen
  // banners don't download on first paint. Slide 0 is active immediately.
  const [activated, setActivated] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    setActivated((s) => (s.has(current) ? s : new Set(s).add(current)));
  }, [current]);

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
    goTo((current + 1) % banners.length, "next");
  }, [current, banners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length, "prev");
  }, [current, banners.length, goTo]);

  useEffect(() => {
    setTimeout(() => setTextStage(1), 400);
    setTimeout(() => setTextStage(2), 600);
    setTimeout(() => setTextStage(3), 800);
  }, []);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = 50;
    const timer = setInterval(() => {
      setProgress((p) => {
        const n = p + (interval / AUTO_ADVANCE_MS) * 100;
        return n >= 100 ? 100 : n;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [isPaused, banners.length, current]);

  useEffect(() => {
    if (progress >= 100) next();
  }, [progress, next]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev, banners.length]);

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

  const banner = banners[current];
  const showOverlay = banner.showOverlay !== false;
  const sharedHandlers = {
    onMouseEnter: () => setIsPaused(true),
    onMouseLeave: () => setIsPaused(false),
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  const textVisible = !isTransitioning;

  if (layout === "split") {
    return (
      <SplitLayout
        banners={banners}
        current={current}
        next={next}
        prev={prev}
        progress={progress}
        banner={banner}
        textStage={textStage}
        textVisible={textVisible}
        slideDirection={slideDirection}
        sharedHandlers={sharedHandlers}
        shopNow={tr("shopNow")}
        locale={locale}
        sectionStyle={sectionStyle}
        activated={activated}
      />
    );
  }

  if (layout === "centered") {
    return (
      <CenteredLayout
        banners={banners}
        current={current}
        next={next}
        prev={prev}
        progress={progress}
        banner={banner}
        textStage={textStage}
        textVisible={textVisible}
        slideDirection={slideDirection}
        sharedHandlers={sharedHandlers}
        shopNow={tr("shopNow")}
        locale={locale}
        sectionStyle={sectionStyle}
        activated={activated}
      />
    );
  }

  if (layout === "minimal") {
    return (
      <MinimalLayout
        banners={banners}
        current={current}
        next={next}
        prev={prev}
        progress={progress}
        banner={banner}
        textStage={textStage}
        textVisible={textVisible}
        slideDirection={slideDirection}
        sharedHandlers={sharedHandlers}
        shopNow={tr("shopNow")}
        locale={locale}
        sectionStyle={sectionStyle}
        activated={activated}
      />
    );
  }

  // Default: slider
  const slideNum = String(current + 1).padStart(2, "0");
  const totalNum = String(banners.length).padStart(2, "0");

  return (
    <section
      className="relative w-full h-[32rem] md:h-[38rem] lg:h-[44rem] overflow-hidden bg-gray-950"
      style={sectionStyle}
      {...sharedHandlers}
    >
      {banners.map((b, i) => (
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
          {activated.has(i) && b.image && (
            <StoreImage
              src={b.image}
              variants={b.variants}
              blurDataURL={b.blurDataURL}
              alt={t(b.title, locale)}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-[20s] ease-out ${i === current ? "scale-110" : "scale-100"}`}
            />
          )}
        </div>
      ))}

      {showOverlay && (
        <div
          className="absolute inset-0 z-[3]"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%), linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
          }}
        />
      )}

      {!showOverlay && banner.linkUrl && (
        <Link
          href={banner.linkUrl}
          className="absolute inset-0 z-[4]"
          aria-label={t(banner.title, locale)}
        />
      )}

      {showOverlay && (
      <div className="absolute inset-0 z-[4] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <div
              className="h-px w-12 mb-6 transition-all duration-700 ease-out"
              style={{
                backgroundColor: "var(--color-primary)",
                opacity: textStage >= 1 && textVisible ? 1 : 0,
                transform: textStage >= 1 && textVisible ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: "left",
              }}
            />
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-5 transition-all duration-700 ease-out"
              style={{
                opacity: textStage >= 1 && textVisible ? 1 : 0,
                transform: textStage >= 1 && textVisible ? "translateY(0)" : "translateY(30px)",
              }}
            >
              {t(banner.title, locale)}
            </h1>
            {t(banner.subtitle, locale) && (
              <p
                className="text-base md:text-lg text-white/70 font-light mb-8 max-w-lg leading-relaxed transition-all duration-700 ease-out"
                style={{
                  opacity: textStage >= 2 && textVisible ? 1 : 0,
                  transform: textStage >= 2 && textVisible ? "translateY(0)" : "translateY(24px)",
                }}
              >
                {t(banner.subtitle, locale)}
              </p>
            )}
            {banner.linkUrl && (
              <div
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: textStage >= 3 && textVisible ? 1 : 0,
                  transform: textStage >= 3 && textVisible ? "translateY(0)" : "translateY(24px)",
                }}
              >
                <Link
                  href={banner.linkUrl}
                  className="group inline-flex items-center gap-3 text-white font-medium text-sm tracking-wide uppercase"
                >
                  <span
                    className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/30 group-hover:border-white/60 group-hover:scale-110 transition-all duration-300"
                    style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)" }}
                  >
                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
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
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-8 right-6 sm:right-8 lg:right-12 z-[4] hidden md:flex items-end gap-3 text-white">
          <span className="text-5xl lg:text-6xl font-extralight tabular-nums leading-none opacity-90">{slideNum}</span>
          <div className="flex flex-col items-start gap-1 pb-2">
            <span className="text-xs text-white/40 tracking-widest uppercase">/ {totalNum}</span>
          </div>
        </div>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-8 left-6 sm:left-8 lg:left-12 z-[4] flex items-center gap-1">
          <button onClick={prev} className="p-2.5 text-white/60 hover:text-white transition-colors duration-200" aria-label="Previous banner">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="w-px h-5 bg-white/20 mx-1" />
          <button onClick={next} className="p-2.5 text-white/60 hover:text-white transition-colors duration-200" aria-label="Next banner">
            <ArrowRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-[4] flex">
          {banners.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] bg-white/10">
              <div
                className="h-full transition-all ease-linear"
                style={{
                  width: i === current ? `${progress}%` : i < current ? "100%" : "0%",
                  backgroundColor: i === current ? "var(--color-primary)" : "rgba(255,255,255,0.25)",
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

// ── Shared props for sub-layouts ──────────────────────────────────────────────

interface LayoutProps {
  banners: IHeroBanner[];
  current: number;
  next: () => void;
  prev: () => void;
  progress: number;
  banner: IHeroBanner;
  textStage: number;
  textVisible: boolean;
  slideDirection: "next" | "prev";
  sharedHandlers: object;
  shopNow: string;
  locale: string;
  sectionStyle?: React.CSSProperties;
  activated: Set<number>;
}

// ── Split layout ──────────────────────────────────────────────────────────────

function SplitLayout({
  banners,
  current,
  next,
  prev,
  progress,
  banner,
  textStage,
  textVisible,
  slideDirection,
  sharedHandlers,
  shopNow,
  locale,
  sectionStyle,
  activated,
}: LayoutProps) {
  const showOverlay = banner.showOverlay !== false;
  return (
    <section
      className="relative w-full overflow-hidden bg-gray-950 flex flex-col md:flex-row min-h-[28rem] md:h-[38rem] lg:h-[44rem]"
      style={sectionStyle}
      {...sharedHandlers}
    >
      {/* Image side (left) */}
      <div className="relative w-full md:w-1/2 h-64 md:h-full overflow-hidden shrink-0">
        {banners.map((b, i) => (
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
            {activated.has(i) && b.image && (
              <StoreImage
                src={b.image}
                variants={b.variants}
                blurDataURL={b.blurDataURL}
                alt={t(b.title, locale)}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover transition-transform duration-[20s] ease-out ${i === current ? "scale-110" : "scale-100"}`}
              />
            )}
          </div>
        ))}
        {/* Gradient bleed to text side on md+ */}
        <div className="absolute inset-y-0 right-0 w-16 z-[3] hidden md:block"
          style={{ background: "linear-gradient(to right, transparent, var(--color-bg, #fff))" }} />
      </div>

      {/* Text side (right) */}
      <div
        className="relative flex-1 flex flex-col justify-center px-8 md:px-12 lg:px-16 py-10 md:py-0"
        style={{ backgroundColor: "var(--color-bg, #ffffff)" }}
      >
        {showOverlay && (
        <div className="max-w-lg">
          <div
            className="h-1 w-12 mb-8 rounded-full transition-all duration-700 ease-out"
            style={{
              backgroundColor: "var(--color-primary)",
              opacity: textStage >= 1 && textVisible ? 1 : 0,
              transform: textStage >= 1 && textVisible ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left",
            }}
          />
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-5 transition-all duration-700 ease-out"
            style={{
              color: "var(--color-text)",
              opacity: textStage >= 1 && textVisible ? 1 : 0,
              transform: textStage >= 1 && textVisible ? "translateY(0)" : "translateY(24px)",
            }}
          >
            {t(banner.title, locale)}
          </h1>
          {t(banner.subtitle, locale) && (
            <p
              className="text-base md:text-lg font-light mb-8 max-w-sm leading-relaxed transition-all duration-700 ease-out"
              style={{
                color: "var(--color-text-secondary, #6B7280)",
                opacity: textStage >= 2 && textVisible ? 1 : 0,
                transform: textStage >= 2 && textVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {t(banner.subtitle, locale)}
            </p>
          )}
          {banner.linkUrl && (
            <div
              className="transition-all duration-700 ease-out"
              style={{
                opacity: textStage >= 3 && textVisible ? 1 : 0,
                transform: textStage >= 3 && textVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <Link
                href={banner.linkUrl}
                className="group inline-flex items-center gap-3 px-7 py-3.5 text-sm font-semibold text-white rounded-full transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {banner.linkText || shopNow}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Navigation dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-6 left-8 md:left-12 lg:left-16 flex items-center gap-4">
            <button onClick={prev} className="p-1.5 rounded-full border border-current opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--color-text)" }} aria-label="Previous">
              <ArrowLeft size={16} />
            </button>
            <div className="flex gap-1.5">
              {banners.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === current ? "24px" : "6px",
                    backgroundColor: i === current ? "var(--color-primary)" : "var(--color-text-secondary, #D1D5DB)",
                    opacity: i === current ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
            <button onClick={next} className="p-1.5 rounded-full border border-current opacity-40 hover:opacity-100 transition-opacity" style={{ color: "var(--color-text)" }} aria-label="Next">
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Progress bar */}
        {banners.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100">
            <div
              className="h-full transition-all ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: "var(--color-primary)",
                transitionDuration: "100ms",
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ── Centered layout ───────────────────────────────────────────────────────────

function CenteredLayout({
  banners,
  current,
  next,
  prev,
  progress,
  banner,
  textStage,
  textVisible,
  slideDirection,
  sharedHandlers,
  shopNow,
  locale,
  sectionStyle,
  activated,
}: LayoutProps) {
  const showOverlay = banner.showOverlay !== false;
  return (
    <section
      className="relative w-full h-[32rem] md:h-[38rem] lg:h-[44rem] overflow-hidden bg-gray-950"
      style={sectionStyle}
      {...sharedHandlers}
    >
      {banners.map((b, i) => (
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
          {activated.has(i) && b.image && (
            <StoreImage
              src={b.image}
              variants={b.variants}
              blurDataURL={b.blurDataURL}
              alt={t(b.title, locale)}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-[20s] ease-out ${i === current ? "scale-110" : "scale-100"}`}
            />
          )}
        </div>
      ))}

      {showOverlay && (
        <div
          className="absolute inset-0 z-[3]"
          style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)" }}
        />
      )}

      {!showOverlay && banner.linkUrl && (
        <Link
          href={banner.linkUrl}
          className="absolute inset-0 z-[4]"
          aria-label={t(banner.title, locale)}
        />
      )}

      {showOverlay && (
      <div className="absolute inset-0 z-[4] flex items-center justify-center text-center px-6">
        <div className="max-w-3xl">
          {/* Label chip */}
          {t(banner.subtitle, locale) && (
            <div
              className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest mb-6 transition-all duration-700 ease-out"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 25%, transparent)",
                color: "var(--color-primary)",
                backdropFilter: "blur(8px)",
                border: "1px solid color-mix(in srgb, var(--color-primary) 40%, transparent)",
                opacity: textStage >= 1 && textVisible ? 1 : 0,
                transform: textStage >= 1 && textVisible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
              }}
            >
              {t(banner.subtitle, locale)}
            </div>
          )}

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-white mb-8 transition-all duration-700 ease-out"
            style={{
              opacity: textStage >= 2 && textVisible ? 1 : 0,
              transform: textStage >= 2 && textVisible ? "translateY(0)" : "translateY(28px)",
              textShadow: "0 2px 40px rgba(0,0,0,0.4)",
            }}
          >
            {t(banner.title, locale)}
          </h1>

          {banner.linkUrl && (
            <div
              className="transition-all duration-700 ease-out"
              style={{
                opacity: textStage >= 3 && textVisible ? 1 : 0,
                transform: textStage >= 3 && textVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <Link
                href={banner.linkUrl}
                className="group inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold rounded-full transition-all duration-300 hover:opacity-90 hover:shadow-2xl hover:-translate-y-1"
                style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
              >
                {banner.linkText || shopNow}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Dot navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-[4] flex items-center justify-center gap-3">
          <button onClick={prev} className="p-2 text-white/60 hover:text-white transition-colors" aria-label="Previous">
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          {banners.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === current ? "28px" : "6px",
                backgroundColor: i === current ? "var(--color-primary)" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
          <button onClick={next} className="p-2 text-white/60 hover:text-white transition-colors" aria-label="Next">
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-[4] h-[3px] bg-white/10">
          <div
            className="h-full transition-all ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--color-primary)",
              transitionDuration: "100ms",
            }}
          />
        </div>
      )}
    </section>
  );
}

// ── Minimal layout ────────────────────────────────────────────────────────────

function MinimalLayout({
  banners,
  current,
  next,
  prev,
  progress,
  banner,
  textStage,
  textVisible,
  slideDirection,
  sharedHandlers,
  shopNow,
  locale,
  sectionStyle,
  activated,
}: LayoutProps) {
  const showOverlay = banner.showOverlay !== false;
  return (
    <section
      className="relative w-full h-[32rem] md:h-[38rem] lg:h-[52rem] overflow-hidden bg-gray-950"
      style={sectionStyle}
      {...sharedHandlers}
    >
      {banners.map((b, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-[1000ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
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
          {activated.has(i) && b.image && (
            <StoreImage
              src={b.image}
              variants={b.variants}
              blurDataURL={b.blurDataURL}
              alt={t(b.title, locale)}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-[25s] ease-out ${i === current ? "scale-105" : "scale-100"}`}
            />
          )}
        </div>
      ))}

      {showOverlay && (
        <div
          className="absolute inset-x-0 bottom-0 z-[3] h-2/5"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)" }}
        />
      )}

      {!showOverlay && banner.linkUrl && (
        <Link
          href={banner.linkUrl}
          className="absolute inset-0 z-[4]"
          aria-label={t(banner.title, locale)}
        />
      )}

      {showOverlay && (
      <div className="absolute inset-x-0 bottom-0 z-[4] pb-14 px-6 sm:px-10 lg:px-14">
        <div className="max-w-7xl mx-auto flex items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-3 transition-all duration-700 ease-out"
              style={{
                opacity: textStage >= 1 && textVisible ? 1 : 0,
                transform: textStage >= 1 && textVisible ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {t(banner.title, locale)}
            </h1>
            {t(banner.subtitle, locale) && (
              <p
                className="text-white/65 text-base md:text-lg font-light transition-all duration-700 ease-out"
                style={{
                  opacity: textStage >= 2 && textVisible ? 1 : 0,
                  transform: textStage >= 2 && textVisible ? "translateY(0)" : "translateY(16px)",
                }}
              >
                {t(banner.subtitle, locale)}
              </p>
            )}
          </div>

          {banner.linkUrl && (
            <div
              className="shrink-0 transition-all duration-700 ease-out hidden sm:block"
              style={{
                opacity: textStage >= 3 && textVisible ? 1 : 0,
                transform: textStage >= 3 && textVisible ? "translateY(0)" : "translateY(16px)",
              }}
            >
              <Link
                href={banner.linkUrl}
                className="group inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 rounded-full"
              >
                {banner.linkText || shopNow}
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Arrows + dots at bottom-left */}
      {banners.length > 1 && (
        <div className="absolute bottom-5 left-6 sm:left-10 lg:left-14 z-[5] flex items-center gap-2">
          <button onClick={prev} className="p-1.5 text-white/50 hover:text-white transition-colors" aria-label="Previous">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div className="flex gap-1">
            {banners.map((_, i) => (
              <div
                key={i}
                className="h-[2px] rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "20px" : "5px",
                  backgroundColor: i === current ? "var(--color-primary)" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
          <button onClick={next} className="p-1.5 text-white/50 hover:text-white transition-colors" aria-label="Next">
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-[4] h-[2px] bg-white/10">
          <div
            className="h-full transition-all ease-linear"
            style={{
              width: `${progress}%`,
              backgroundColor: "var(--color-primary)",
              transitionDuration: "100ms",
            }}
          />
        </div>
      )}
    </section>
  );
}

// ── Grid layout (static, shows multiple banners simultaneously) ───────────────

function GridLayout({
  banners,
  sectionStyle,
}: {
  banners: IHeroBanner[];
  sectionStyle?: React.CSSProperties;
}) {
  const tr = useTranslations("heroBanner");
  const locale = useLocale();

  const main = banners[0];
  const side = banners.slice(1, 3);

  return (
    <section className="w-full overflow-hidden" style={sectionStyle}>
      <div className="flex flex-col md:flex-row h-auto md:h-[38rem] lg:h-[44rem] gap-1">
        {/* Large left panel */}
        <div className="relative flex-[2] min-h-[22rem] md:min-h-0 overflow-hidden group bg-gray-900">
          {main.image && (
            <StoreImage
              src={main.image}
              variants={main.variants}
              blurDataURL={main.blurDataURL}
              alt={t(main.title, locale)}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition-transform duration-[8s] ease-out group-hover:scale-105"
            />
          )}
          {main.showOverlay !== false && (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 60%, transparent 100%)" }}
            />
          )}
          {main.showOverlay !== false ? (
            <div className="absolute inset-0 flex items-end p-8 md:p-10 lg:p-12">
              <div className="max-w-md">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-3">
                  {t(main.title, locale)}
                </h1>
                {t(main.subtitle, locale) && (
                  <p className="text-white/70 text-sm md:text-base mb-6 leading-relaxed">
                    {t(main.subtitle, locale)}
                  </p>
                )}
                {main.linkUrl && (
                  <Link
                    href={main.linkUrl}
                    className="group/btn inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold rounded-full text-white transition-all duration-300 hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {main.linkText || tr("shopNow")}
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            main.linkUrl && (
              <Link
                href={main.linkUrl}
                className="absolute inset-0"
                aria-label={t(main.title, locale)}
              />
            )
          )}
        </div>

        {/* Right column — up to 2 stacked panels */}
        {side.length > 0 && (
          <div className="flex flex-row md:flex-col flex-1 gap-1 min-h-[14rem] md:min-h-0">
            {side.map((b, i) => (
              <div key={i} className="relative flex-1 overflow-hidden group bg-gray-800">
                {b.image && (
                  <StoreImage
                    src={b.image}
                    variants={b.variants}
                    blurDataURL={b.blurDataURL}
                    alt={t(b.title, locale)}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[8s] ease-out group-hover:scale-105"
                  />
                )}
                {b.showOverlay !== false && (
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }}
                  />
                )}
                {b.showOverlay !== false ? (
                <div className="absolute inset-0 flex items-end p-5 md:p-6">
                  <div>
                    <p className="text-white font-semibold text-base md:text-lg leading-tight mb-1.5">
                      {t(b.title, locale)}
                    </p>
                    {b.linkUrl && (
                      <Link
                        href={b.linkUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
                      >
                        {b.linkText || tr("shopNow")}
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
                ) : (
                  b.linkUrl && (
                    <Link
                      href={b.linkUrl}
                      className="absolute inset-0"
                      aria-label={t(b.title, locale)}
                    />
                  )
                )}
              </div>
            ))}
            {/* Placeholder if only 1 banner provided */}
            {side.length === 1 && (
              <div className="flex-1 bg-gray-100 hidden md:block" style={{ backgroundColor: "var(--color-bg)" }} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Image Only layout (pure banner, no text/overlay) ─────────────────────────

function ImageOnlyLayout({
  banners,
  sectionStyle,
}: {
  banners: IHeroBanner[];
  sectionStyle?: React.CSSProperties;
}) {
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [aspect, setAspect] = useState<number | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Only shown slides render their <img> (no first-paint download of off-screen banners).
  const [activated, setActivated] = useState<Set<number>>(() => new Set([0]));
  useEffect(() => {
    setActivated((s) => (s.has(current) ? s : new Set(s).add(current)));
  }, [current]);

  const goTo = useCallback(
    (index: number, direction?: "next" | "prev") => {
      if (isTransitioning) return;
      setSlideDirection(direction ?? (index > current ? "next" : "prev"));
      setIsTransitioning(true);
      setCurrent(index);
      setProgress(0);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning, current]
  );

  const next = useCallback(() => goTo((current + 1) % banners.length, "next"), [current, banners.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + banners.length) % banners.length, "prev"), [current, banners.length, goTo]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        const n = p + (50 / AUTO_ADVANCE_MS) * 100;
        return n >= 100 ? 100 : n;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [isPaused, banners.length, current]);

  useEffect(() => { if (progress >= 100) next(); }, [progress, next]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [next, prev, banners.length]);

  return (
    <section
      className="relative w-full overflow-hidden bg-gray-950"
      style={{
        ...sectionStyle,
        aspectRatio: aspect ?? (16 / 9),
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
        setIsPaused(true);
      }}
      onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
      onTouchEnd={() => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > SWIPE_THRESHOLD) { if (diff > 0) next(); else prev(); }
        setIsPaused(false);
      }}
    >
      {/* Pure images — zero overlay, zero text. First banner sets section aspect. */}
      {banners.map((b, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-[900ms] ease-[cubic-bezier(0.77,0,0.18,1)]"
          style={{
            clipPath: i === current
              ? "inset(0 0 0 0)"
              : slideDirection === "next"
                ? "inset(0 0 0 100%)"
                : "inset(0 100% 0 0)",
            zIndex: i === current ? 2 : 1,
          }}
        >
          {activated.has(i) && b.image && (
            <StoreImage
              src={b.image}
              variants={b.variants}
              blurDataURL={b.blurDataURL}
              alt={t(b.title, locale)}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-contain transition-transform duration-[25s] ease-out ${i === current ? "scale-105" : "scale-100"}`}
              onLoad={
                i === 0
                  ? (e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (img.naturalWidth && img.naturalHeight) {
                        setAspect(img.naturalWidth / img.naturalHeight);
                      }
                    }
                  : undefined
              }
            />
          )}
          {b.linkUrl && (
            <a href={b.linkUrl} className="absolute inset-0 z-10" aria-label={t(b.title, locale)} />
          )}
        </div>
      ))}

      {/* Navigation — only shown on hover, minimal chrome */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[3] w-10 h-10 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm text-white transition-all duration-200 hover:scale-105"
            aria-label="Previous"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[3] w-10 h-10 flex items-center justify-center rounded-full bg-black/25 hover:bg-black/45 backdrop-blur-sm text-white transition-all duration-200 hover:scale-105"
            aria-label="Next"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-5 left-0 right-0 z-[3] flex justify-center gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className="transition-all duration-300"
                style={{
                  width: i === current ? "24px" : "6px",
                  height: "6px",
                  borderRadius: "9999px",
                  backgroundColor: i === current
                    ? "var(--color-primary)"
                    : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-[3] h-[3px] bg-white/10">
            <div
              className="h-full transition-all ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: "var(--color-primary)",
                transitionDuration: "100ms",
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

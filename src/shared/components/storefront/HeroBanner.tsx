"use client";

import Link from "next/link";
import type { IHeroBanner } from "@/features/stores/types";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/shared/lib/i18n";

export function HeroBanner({ banners }: { banners: IHeroBanner[] }) {
  const tr = useTranslations("heroBanner");
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeBanners = banners?.filter((b) => t(b.title, locale)) || [];

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % activeBanners.length);
  }, [current, activeBanners.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + activeBanners.length) % activeBanners.length);
  }, [current, activeBanners.length, goTo]);

  // Auto-advance
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [next, activeBanners.length]);

  // Early return AFTER all hooks
  if (activeBanners.length === 0) return null;

  const banner = activeBanners[current];

  return (
    <section className="relative w-full h-[28rem] md:h-[36rem] lg:h-[42rem] overflow-hidden bg-gray-900">
      {/* Background images - all preloaded, only current visible */}
      {activeBanners.map((b, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {b.image && (
            <img
              src={b.image}
              alt={t(b.title, locale)}
              className={`w-full h-full object-cover ${
                i === current ? "animate-hero-zoom" : ""
              }`}
            />
          )}
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/25 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-center text-white px-6 max-w-3xl transition-all duration-700 ${
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight tracking-tight drop-shadow-lg">
            {t(banner.title, locale)}
          </h1>
          {t(banner.subtitle, locale) && (
            <p className="text-base md:text-lg font-light text-white/80 mb-8 max-w-xl mx-auto drop-shadow-md">
              {t(banner.subtitle, locale)}
            </p>
          )}
          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              className="inline-flex items-center gap-2 px-10 py-4 font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {banner.linkText || tr("shopNow")}
              <ChevronRight size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Navigation arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            aria-label="Previous banner"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
            aria-label="Next banner"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2.5">
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? "w-8 h-2 bg-white"
                  : "w-2 h-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import type { IHeroBanner } from "@/features/stores/types";
import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroBanner({ banners }: { banners: IHeroBanner[] }) {
  const t = useTranslations("heroBanner");
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const activeBanners = banners?.filter((b) => b.title) || [];

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
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, activeBanners.length]);

  // Early return AFTER all hooks
  if (activeBanners.length === 0) return null;

  const banner = activeBanners[current];

  return (
    <section className="relative w-full h-112 md:h-144 lg:h-160 overflow-hidden bg-gray-900">
      {/* Background images - all preloaded, only current visible */}
      {activeBanners.map((b, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          {b.image && (
            <img
              src={b.image}
              alt={b.title}
              className={`w-full h-full object-cover ${
                i === current ? "animate-hero-zoom" : ""
              }`}
            />
          )}
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-black/10" />

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
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-xl mx-auto drop-shadow-md">
              {banner.subtitle}
            </p>
          )}
          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {banner.linkText || t("shopNow")}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm"
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
                  ? "w-8 h-2.5 bg-white"
                  : "w-2.5 h-2.5 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to banner ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import type { IHeroBanner } from "@/features/stores/types";

export function HeroBanner({ banners }: { banners: IHeroBanner[] }) {
  if (!banners || banners.length === 0) return null;

  const banner = banners[0];

  return (
    <section className="relative w-full h-100 md:h-125 overflow-hidden bg-gray-100">
      {banner.image && (
        <img
          src={banner.image}
          alt={banner.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="text-lg md:text-xl mb-6 opacity-90">
              {banner.subtitle}
            </p>
          )}
          {banner.linkUrl && (
            <Link
              href={banner.linkUrl}
              className="inline-block px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {banner.linkText || "Shop Now"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

import type { HeroLayoutStyle, IHeroBanner } from "@/features/stores/types";
import type { HeroStyle } from "@/features/stores/styles";

// Plain module (no "use client"): shared by HeroBanner, its skeleton and the server
// home page, so the hero box, the page's top spacing and the loading state agree.

/**
 * Whether the home hero renders as the full-bleed styled hero (CinematicLayout): the
 * default slider layout with a video banner (the base behaviour), or with any non-base
 * heroStyle. Other heroLayout values keep their own layouts.
 */
export function usesStyledHero(
  banners: IHeroBanner[] | undefined,
  layout: HeroLayoutStyle | undefined,
  heroStyle: HeroStyle
): boolean {
  if ((layout ?? "slider") !== "slider") return false;
  const active = banners?.filter((b) => b.image) ?? [];
  if (active.length === 0) return false;
  return heroStyle !== "cinematic" || active.some((b) => b.video);
}

/** Outer box of the styled hero per heroStyle (the skeleton reserves the same box). */
export const HERO_SHELL: Record<HeroStyle, string> = {
  cinematic: "h-[27rem] sm:h-[34rem] md:h-[40rem] lg:h-[46rem]",
  film: "h-[27rem] sm:h-[34rem] lg:h-[calc(100svh-8.5rem)] lg:min-h-[36rem] lg:max-h-[56rem]",
  framed:
    "aspect-[4/3] sm:aspect-[16/9] md:aspect-auto md:h-[min(calc(100svh-7rem),42rem)] md:min-h-[30rem]",
  editorial: "h-[23rem] sm:h-[30rem] md:h-[clamp(32rem,calc(100svh-14rem),46rem)]",
};

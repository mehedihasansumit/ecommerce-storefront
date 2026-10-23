import type { IHeroBanner, HeroLayoutStyle } from "@/features/stores/types";
import type { HeroStyle } from "@/features/stores/styles";
import { Skeleton } from "@/shared/components/ui";
import { HERO_SHELL, usesStyledHero } from "./hero-styles";

interface HeroBannerSkeletonProps {
  banners: IHeroBanner[];
  layout?: HeroLayoutStyle;
  contained?: boolean;
  borderRadius?: string;
  /** The Store's heroStyle Style Switch (the styled hero's box depends on it). */
  heroStyle?: HeroStyle;
}

// Outer sizes of each HeroBanner layout (keep in sync with HeroBanner.tsx).
const ROTATING_HEIGHT: Record<string, string> = {
  slider: "aspect-[16/9] md:aspect-auto md:h-[38rem] lg:h-[44rem]",
  split: "min-h-[28rem] md:h-[38rem] lg:h-[44rem]",
  centered: "h-[32rem] md:h-[38rem] lg:h-[44rem]",
  minimal: "h-[32rem] md:h-[38rem] lg:h-[52rem]",
};

/**
 * Loading placeholder that reserves exactly the box HeroBanner will occupy for the
 * same store config (layout, video, contained, radius). Server-safe.
 */
export function HeroBannerSkeleton({
  banners,
  layout = "slider",
  contained = false,
  borderRadius,
  heroStyle = "cinematic",
}: HeroBannerSkeletonProps) {
  const active = banners?.filter((b) => b.image) ?? [];
  if (active.length === 0) return null;
  const style = borderRadius ? { borderRadius } : undefined;

  let inner: React.ReactElement;
  if (layout === "grid") {
    const sides = Math.min(active.length - 1, 2);
    inner = (
      <div aria-hidden className="w-full overflow-hidden" style={style}>
        <div className="flex flex-col md:flex-row h-auto md:h-[38rem] lg:h-[44rem] gap-1">
          <Skeleton radius="none" className="flex-[2] min-h-[22rem] md:min-h-0" />
          {sides > 0 && (
            <div className="flex flex-row md:flex-col flex-1 gap-1 min-h-[14rem] md:min-h-0">
              {Array.from({ length: sides }).map((_, i) => (
                <Skeleton key={i} radius="none" className="flex-1" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } else if (layout === "image") {
    // Real height follows the image's own aspect once loaded; 16:9 until then.
    inner = <Skeleton radius="none" className="w-full aspect-video" style={style} />;
  } else {
    const box = usesStyledHero(active, layout, heroStyle)
      ? HERO_SHELL[heroStyle]
      : ROTATING_HEIGHT[layout] ?? ROTATING_HEIGHT.slider;
    inner = (
      <Skeleton
        radius="none"
        className={`relative w-full overflow-hidden ${box}`}
        style={style}
      />
    );
  }

  return contained ? (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{inner}</div>
  ) : (
    inner
  );
}

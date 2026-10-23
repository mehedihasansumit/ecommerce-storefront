"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Marquee, MarqueeRow, MarqueeToggle } from "@/shared/components/storefront/Marquee";

// The home "Shop by Category" marquee (count >= MARQUEE_MIN and the store's
// theme.motion.categories on, see ../layout.ts): the shared storefront Marquee,
// moving right to left. Mechanics and accessibility live in Marquee.tsx.

/** Shares the visitor's Pause/Play choice between the header toggle and the row. */
export function CategoryMarquee({ children }: { children: ReactNode }) {
  return <Marquee>{children}</Marquee>;
}

/** Pause/Play for the moving row. Hidden (with the motion) under reduced motion. */
export function CategoryMarqueeToggle({ controls }: { controls: string }) {
  const t = useTranslations("home");
  return <MarqueeToggle controls={controls} label={t("categoriesPause")} />;
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

/** The moving row (right to left): one real list, one aria-hidden + inert copy. */
export function CategoryMarqueeRow(props: CategoryMarqueeRowProps) {
  return <MarqueeRow direction="rtl" {...props} />;
}

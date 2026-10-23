/**
 * Style Switches: for a few storefront sections, a small fixed set of layouts a Store
 * picks from (stored in `theme.styles`). The first option of each list is the default
 * and is today's base behaviour, so a Store that sets nothing looks unchanged.
 *
 * Pure module (no React, no DB): shared by types, Zod schemas, the preset registry,
 * the root layout (data-* attributes) and the admin form.
 */

/**
 * Home hero treatment of the full-bleed slider (`heroLayout: "slider"`, the default).
 * - cinematic: tenant-tinted scrim, eyebrow with the store name, serif title (base)
 * - film:      tall film, neutral scrim, large sans title, trust facts on a header-coloured band
 * - framed:    inset accent hairline frame, header colour bleeding into the top
 * - editorial: brand-ink scrim, italic subtitle, accent CTA and a double "zari" hairline at the foot
 * Other `heroLayout` values (split, centered, minimal, grid, image) keep their own layout.
 */
export const HERO_STYLES = ["cinematic", "film", "framed", "editorial"] as const;

/**
 * Home "Shop by Category".
 * - tiles:      count-adaptive tiles, compact row cards for up to 4 (base)
 * - scroll-row: grid up to 6, snap row with prev/next from 7
 * - plates:     4:5 plates with an inset accent frame, heading beside a short row
 * - cards:      large image cards with the name and count underneath
 */
export const CATEGORY_STYLES = ["tiles", "scroll-row", "plates", "cards"] as const;

/** Footer: four columns (base) or columns closed by the store name set full width. */
export const FOOTER_STYLES = ["columns", "wordmark"] as const;

/**
 * Home newsletter: an inset rounded panel inside the page container (base), or a
 * full-bleed band in the newsletter colour, edge to edge.
 */
export const NEWSLETTER_STYLES = ["panel", "band"] as const;

/**
 * Product card: bordered square card (base), portrait image on the page with quiet
 * type under it (editorial), or editorial with photography settled into the page at
 * night and the sold-out state as a label (plate).
 */
export const PRODUCT_CARD_STYLES = ["boxed", "editorial", "plate"] as const;

export type HeroStyle = (typeof HERO_STYLES)[number];
export type CategoryStyle = (typeof CATEGORY_STYLES)[number];
export type FooterStyle = (typeof FOOTER_STYLES)[number];
export type NewsletterStyle = (typeof NEWSLETTER_STYLES)[number];
export type ProductCardStyle = (typeof PRODUCT_CARD_STYLES)[number];

export interface IStoreStyles {
  heroStyle?: HeroStyle;
  categoryStyle?: CategoryStyle;
  footerStyle?: FooterStyle;
  newsletterStyle?: NewsletterStyle;
  productCardStyle?: ProductCardStyle;
}

export type ResolvedStoreStyles = Required<IStoreStyles>;

/** Every Style Switch with its options, in admin display order. */
export const STYLE_SWITCHES = {
  heroStyle: HERO_STYLES,
  categoryStyle: CATEGORY_STYLES,
  productCardStyle: PRODUCT_CARD_STYLES,
  newsletterStyle: NEWSLETTER_STYLES,
  footerStyle: FOOTER_STYLES,
} as const;

export type StyleSwitchKey = keyof typeof STYLE_SWITCHES;

export const DEFAULT_STYLES: ResolvedStoreStyles = {
  heroStyle: "cinematic",
  categoryStyle: "tiles",
  footerStyle: "columns",
  newsletterStyle: "panel",
  productCardStyle: "boxed",
};

/** Keeps only known options, so a stale or hand-edited value falls back to the default. */
export function sanitizeStyles(styles: unknown): IStoreStyles {
  if (!styles || typeof styles !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, options] of Object.entries(STYLE_SWITCHES)) {
    const value = (styles as Record<string, unknown>)[key];
    if (typeof value === "string" && (options as readonly string[]).includes(value)) {
      out[key] = value;
    }
  }
  return out as IStoreStyles;
}

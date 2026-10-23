import type { IStoreDarkTheme, IStoreTheme } from "./types";
import {
  DEFAULT_STYLES,
  sanitizeStyles,
  type ResolvedStoreStyles,
} from "./styles";

/**
 * Theme Presets: named, reusable starting Themes a Store picks and then overrides.
 * Each one is the look of one Variant (the four storefront redesigns), taken from that
 * Variant's Punjabi Palace theme: light + dark palette, fonts (all in the font registry,
 * src/shared/lib/fonts.ts), radius, page background and Style Switch defaults.
 *
 * Pure module: no React, no DB. Display names and descriptions are translated
 * (messages: themePresets.<id>.name / .description).
 */

export const THEME_PRESET_IDS = ["atelier", "zari-oxblood", "dark-room", "shiraz-zari"] as const;
export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

/** Theme values a preset supplies; everything is optional and the Store may override any of it. */
export type PresetTheme = Partial<Omit<IStoreTheme, "dark" | "preset" | "styles">> & {
  dark: Partial<IStoreDarkTheme>;
};

export interface StoreThemePreset {
  id: ThemePresetId;
  theme: PresetTheme;
  styles: ResolvedStoreStyles;
}

export const STORE_THEME_PRESETS: Record<ThemePresetId, StoreThemePreset> = {
  /** ui-ux-pro-max: Ivory Atelier by day, Midnight Gold by night. The base look. */
  atelier: {
    id: "atelier",
    theme: {
      primaryColor: "#7A1F2E",
      secondaryColor: "#14213D",
      accentColor: "#A16207",
      backgroundColor: "#FBF8F2",
      textColor: "#1B1A17",
      surfaceColor: "#F4EEE3",
      borderColor: "#E6DDCC",
      headerBg: "#FFFDF8",
      headerText: "#1B1A17",
      cardBg: "#FFFFFF",
      newsletterBg: "#5E1622",
      newsletterText: "#FBF3E6",
      newsletterBtnBg: "#D4B06A",
      newsletterBtnText: "#1B1A17",
      priceColor: "#1B1A17",
      saleBadgeBg: "#7A1F2E",
      saleBadgeText: "#FFFFFF",
      footerBg: "#F2ECE1",
      footerText: "#1B1A17",
      linkColor: "#7A1F2E",
      fontFamily: "Montserrat",
      headingFont: "Cormorant Garamond",
      borderRadius: "0.375rem",
      backgroundPattern: "none",
      dark: {
        primaryColor: "#D4B06A",
        secondaryColor: "#9FB3D9",
        accentColor: "#D4B06A",
        backgroundColor: "#0A1020",
        textColor: "#F2EDE3",
        surfaceColor: "#111A2E",
        borderColor: "#26324D",
        headerBg: "#0E1628",
        headerText: "#F2EDE3",
        cardBg: "#141E35",
        newsletterBg: "#141E35",
        newsletterText: "#F2EDE3",
        newsletterBtnBg: "#D4B06A",
        newsletterBtnText: "#0A1020",
        priceColor: "#F2EDE3",
        saleBadgeBg: "#9E2A3C",
        saleBadgeText: "#FFFFFF",
        footerBg: "#070C18",
        footerText: "#CFC6B5",
        linkColor: "#DDBF7E",
      },
    },
    styles: { ...DEFAULT_STYLES },
  },

  /** impeccable: oxblood and zari gold on warm ivory; aubergine-black at night. */
  "zari-oxblood": {
    id: "zari-oxblood",
    theme: {
      primaryColor: "#7A1F33",
      secondaryColor: "#1F4A3D",
      accentColor: "#9A6C24",
      backgroundColor: "#FBF8F3",
      textColor: "#1F1416",
      surfaceColor: "#F4EEE5",
      borderColor: "#E6DDD0",
      headerBg: "#F4EEE5",
      headerText: "#1F1416",
      cardBg: "#FFFFFF",
      newsletterBg: "#EFE6D8",
      newsletterText: "#1F1416",
      newsletterBtnBg: "#7A1F33",
      newsletterBtnText: "#FFFFFF",
      priceColor: "#1F1416",
      saleBadgeBg: "#7A1F33",
      saleBadgeText: "#FFFFFF",
      footerBg: "#F2EBE0",
      footerText: "#2A1D20",
      linkColor: "#7A1F33",
      heroScrim: "#1A070C",
      fontFamily: "Hind Siliguri",
      headingFont: "Tiro Bangla",
      borderRadius: "0.375rem",
      backgroundPattern: "none",
      dark: {
        primaryColor: "#D4A257",
        secondaryColor: "#7DB39C",
        accentColor: "#D4A257",
        backgroundColor: "#0F0A0B",
        textColor: "#F3EADF",
        surfaceColor: "#1F1619",
        borderColor: "#3A2C31",
        headerBg: "#140D0F",
        headerText: "#F3EADF",
        cardBg: "#171012",
        newsletterBg: "#1F1619",
        newsletterText: "#F3EADF",
        newsletterBtnBg: "#D4A257",
        newsletterBtnText: "#140D0F",
        priceColor: "#F3EADF",
        saleBadgeBg: "#8E2A3E",
        saleBadgeText: "#FFFFFF",
        footerBg: "#0A0607",
        footerText: "#C9B8A6",
        linkColor: "#E0B56E",
        heroScrim: "#0A0506",
      },
    },
    styles: {
      heroStyle: "framed",
      categoryStyle: "plates",
      footerStyle: "columns",
      newsletterStyle: "band",
      productCardStyle: "plate",
    },
  },

  /** taste-skill: gallery-white by day, a dark room by night; one sans, square corners. */
  "dark-room": {
    id: "dark-room",
    theme: {
      primaryColor: "#A87A26",
      secondaryColor: "#7A1F2B",
      accentColor: "#7A1F2B",
      backgroundColor: "#F6F5F3",
      textColor: "#1B1513",
      surfaceColor: "#E9E7E2",
      borderColor: "#DDDAD4",
      headerBg: "#FFFFFF",
      headerText: "#1B1513",
      cardBg: "#EFEDEA",
      newsletterBg: "#7A1F2B",
      newsletterText: "#F6F5F3",
      newsletterBtnBg: "#D4AF5A",
      newsletterBtnText: "#1B1513",
      priceColor: "#1B1513",
      saleBadgeBg: "#7A1F2B",
      saleBadgeText: "#F6F5F3",
      footerBg: "#E9E7E2",
      footerText: "#1B1513",
      linkColor: "#7A1F2B",
      fontFamily: "Switzer",
      borderRadius: "0rem",
      backgroundPattern: "none",
      dark: {
        primaryColor: "#D4AF5A",
        secondaryColor: "#C26A78",
        accentColor: "#8E2A3A",
        backgroundColor: "#120E0D",
        textColor: "#EFEDE9",
        surfaceColor: "#221C1A",
        borderColor: "#2E2725",
        headerBg: "#0C0909",
        headerText: "#EFEDE9",
        cardBg: "#1A1513",
        newsletterBg: "#3A1219",
        newsletterText: "#EFEDE9",
        newsletterBtnBg: "#D4AF5A",
        newsletterBtnText: "#120E0D",
        priceColor: "#EFEDE9",
        saleBadgeBg: "#8E2A3A",
        saleBadgeText: "#EFEDE9",
        footerBg: "#0C0909",
        footerText: "#EFEDE9",
        linkColor: "#D4AF5A",
      },
    },
    styles: {
      heroStyle: "film",
      categoryStyle: "scroll-row",
      footerStyle: "wordmark",
      newsletterStyle: "band",
      productCardStyle: "editorial",
    },
  },

  /** frontend-design: shiraz wine and zari gold, Bodoni headings; plum-black at night. */
  "shiraz-zari": {
    id: "shiraz-zari",
    theme: {
      primaryColor: "#5B1A2E",
      secondaryColor: "#7A5A22",
      accentColor: "#A8823A",
      backgroundColor: "#FDFBF8",
      textColor: "#2A1219",
      surfaceColor: "#F6F1EC",
      borderColor: "#E9E0D8",
      headerBg: "#FDFBF8",
      headerText: "#2A1219",
      cardBg: "#FFFFFF",
      newsletterBg: "#5B1A2E",
      newsletterText: "#FBF5EE",
      newsletterBtnBg: "#D4B26E",
      newsletterBtnText: "#2A1219",
      priceColor: "#2A1219",
      saleBadgeBg: "#5B1A2E",
      saleBadgeText: "#FBF5EE",
      footerBg: "#F3ECE5",
      footerText: "#2A1219",
      linkColor: "#5B1A2E",
      fontFamily: "Instrument Sans",
      headingFont: "Bodoni Moda",
      borderRadius: "0.25rem",
      backgroundPattern: "none",
      dark: {
        primaryColor: "#D9B46C",
        secondaryColor: "#C9A45C",
        accentColor: "#D9B46C",
        backgroundColor: "#120A0E",
        textColor: "#F3EBE4",
        surfaceColor: "#1C1117",
        borderColor: "#3A2830",
        headerBg: "#1A0F15",
        headerText: "#F3EBE4",
        cardBg: "#1F1319",
        newsletterBg: "#2A1520",
        newsletterText: "#F3EBE4",
        newsletterBtnBg: "#D9B46C",
        newsletterBtnText: "#120A0E",
        priceColor: "#F3EBE4",
        saleBadgeBg: "#D9B46C",
        saleBadgeText: "#120A0E",
        footerBg: "#0C0609",
        footerText: "#CDBFB6",
        linkColor: "#E6C887",
      },
    },
    styles: {
      heroStyle: "editorial",
      categoryStyle: "cards",
      footerStyle: "columns",
      newsletterStyle: "panel",
      productCardStyle: "editorial",
    },
  },
};

export function isThemePresetId(value: unknown): value is ThemePresetId {
  return typeof value === "string" && (THEME_PRESET_IDS as readonly string[]).includes(value);
}

export function getThemePreset(id: string | undefined | null): StoreThemePreset | null {
  return isThemePresetId(id) ? STORE_THEME_PRESETS[id] : null;
}

/**
 * Non-colour values every Theme ends up with. Colours are deliberately NOT filled in
 * here: an unset colour stays unset so the token registry (theme-tokens.ts) can derive
 * it (fallback chains, readable-on, contrast darkening) instead of treating a default
 * as an explicit choice.
 */
const BASE_DEFAULTS = {
  fontFamily: "Inter",
  borderRadius: "0.5rem",
  layoutStyle: "grid",
  backgroundPattern: "grid",
} as const satisfies Partial<IStoreTheme>;

/** A Theme with every Style Switch decided. */
export type ResolvedTheme = IStoreTheme & { styles: ResolvedStoreStyles };

/** Drops unset values (undefined, null, "") so they never mask a preset value. */
function setValues<T extends object>(obj: T | undefined | null): Partial<T> {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ) as Partial<T>;
}

/**
 * The Theme a storefront renders: defaults ← preset ← the Store's own values.
 * Anything the Store sets explicitly wins (legacy pins included); a Store that only
 * sets `preset` gets that preset's whole look. Pure.
 */
export function resolveTheme(storeTheme: Partial<IStoreTheme> | undefined | null): ResolvedTheme {
  const own = setValues(storeTheme ?? {});
  const preset = getThemePreset(own.preset);
  const { dark: presetDark, ...presetLight } = preset?.theme ?? { dark: {} };
  const { dark: ownDark, styles: ownStyles, ...ownLight } = own;

  const dark = { ...setValues(presetDark), ...setValues(ownDark) };
  return {
    ...BASE_DEFAULTS,
    ...presetLight,
    ...ownLight,
    ...(Object.keys(dark).length > 0 ? { dark } : {}),
    styles: {
      ...DEFAULT_STYLES,
      ...(preset?.styles ?? {}),
      ...sanitizeStyles(ownStyles),
    },
  } as ResolvedTheme;
}

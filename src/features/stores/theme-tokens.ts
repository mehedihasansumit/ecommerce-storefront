import type { IStoreTheme, IStoreDarkTheme } from "./types";

// Single source of truth for storefront theme color tokens.
// Drives: TS interfaces (manual mirror), Mongoose schema (manual mirror),
// Zod schema, admin form rendering, root-layout CSS-var injection, defaults.

export type ThemeTokenGroup =
  | "core"
  | "surface"
  | "header"
  | "cards"
  | "newsletter"
  | "products"
  | "footer"
  | "links";

export interface ThemeTokenDef {
  key: string;
  cssVar: string;
  label: string;
  group: ThemeTokenGroup;
  lightDefault?: string;
  darkDefault?: string;
  fallbackChain?: string[];
  /** Dark mode, no explicit dark value: lighten until readable on the dark bg/surface (≥ 4.5:1). */
  darkMinContrast?: boolean;
  /** Light mode, value inherited (not set explicitly): darken until ≥ 4.5:1 on bg/surface/card. */
  lightMinContrast?: boolean;
  /** No explicit value: pick white or near-black, whichever reads better on this token. */
  readableOn?: string;
  editableLight: boolean;
  editableDark: boolean;
}

export const THEME_TOKEN_GROUPS: Record<
  ThemeTokenGroup,
  { label: string; description?: string }
> = {
  core: {
    label: "Core",
    description: "Brand and base colors used across the storefront.",
  },
  surface: {
    label: "Surfaces & Borders",
    description: "Subtle panel backgrounds and hairline dividers.",
  },
  header: { label: "Header" },
  cards: { label: "Cards" },
  newsletter: {
    label: "Newsletter",
    description: "Newsletter section colors.",
  },
  products: {
    label: "Products & Prices",
    description: "Price text and sale badge.",
  },
  footer: { label: "Footer" },
  links: { label: "Links" },
};

export const THEME_TOKENS: ThemeTokenDef[] = [
  { key: "primaryColor",      cssVar: "--color-primary",            label: "Primary",         group: "core",       lightDefault: "#3B82F6",                          editableLight: true, editableDark: true, darkMinContrast: true },
  { key: "secondaryColor",    cssVar: "--color-secondary",          label: "Secondary",       group: "core",       lightDefault: "#10B981",                          editableLight: true, editableDark: true },
  { key: "accentColor",       cssVar: "--color-accent",             label: "Accent",          group: "core",       lightDefault: "#F59E0B",                          editableLight: true, editableDark: true },
  { key: "backgroundColor",   cssVar: "--color-bg",                 label: "Background",      group: "core",       lightDefault: "#FFFFFF", darkDefault: "#111827",  editableLight: true, editableDark: true },
  { key: "textColor",         cssVar: "--color-text",               label: "Body Text",       group: "core",       lightDefault: "#111827", darkDefault: "#F9FAFB",  editableLight: true, editableDark: true },

  { key: "surfaceColor",      cssVar: "--color-surface",            label: "Surface",         group: "surface",    lightDefault: "#FAFAFA", darkDefault: "#1F2937",  editableLight: true, editableDark: true },
  { key: "borderColor",       cssVar: "--color-border-subtle",      label: "Border",          group: "surface",    lightDefault: "#F3F4F6", darkDefault: "#374151",  editableLight: true, editableDark: true },

  { key: "headerBg",          cssVar: "--color-header-bg",          label: "Header BG",       group: "header",     lightDefault: "#111827", darkDefault: "#0F172A",  editableLight: true, editableDark: true },
  { key: "headerText",        cssVar: "--color-header-text",        label: "Header Text",     group: "header",     lightDefault: "#FFFFFF", darkDefault: "#F8FAFC",  editableLight: true, editableDark: true },

  { key: "cardBg",            cssVar: "--color-card-bg",            label: "Card BG",         group: "cards",      fallbackChain: ["backgroundColor"],               editableLight: true, editableDark: true },

  { key: "newsletterBg",      cssVar: "--color-newsletter-bg",      label: "Newsletter BG",   group: "newsletter", fallbackChain: ["primaryColor"],                  editableLight: true, editableDark: true },
  { key: "newsletterText",    cssVar: "--color-newsletter-text",    label: "Newsletter Text", group: "newsletter", lightDefault: "#FFFFFF", darkDefault: "#FFFFFF",  editableLight: true, editableDark: true, readableOn: "newsletterBg" },
  { key: "newsletterBtnBg",   cssVar: "--color-newsletter-btn-bg",  label: "Btn BG",          group: "newsletter", lightDefault: "#FFFFFF", darkDefault: "#1F2937",  editableLight: true, editableDark: true },
  { key: "newsletterBtnText", cssVar: "--color-newsletter-btn-text",label: "Btn Text",        group: "newsletter", fallbackChain: ["primaryColor"],                  editableLight: true, editableDark: true },

  { key: "priceColor",        cssVar: "--color-price",              label: "Price",           group: "products",   fallbackChain: ["primaryColor"],                  editableLight: true, editableDark: true, darkMinContrast: true, lightMinContrast: true },
  { key: "saleBadgeBg",       cssVar: "--color-sale-badge-bg",      label: "Sale Badge BG",   group: "products",   lightDefault: "#DC2626", darkDefault: "#DC2626",  editableLight: true, editableDark: true },
  { key: "saleBadgeText",     cssVar: "--color-sale-badge-text",    label: "Sale Badge Text", group: "products",   lightDefault: "#FFFFFF", darkDefault: "#FFFFFF",  editableLight: true, editableDark: true },

  { key: "footerBg",          cssVar: "--color-footer-bg",          label: "Footer BG",       group: "footer",     fallbackChain: ["headerBg"],                      editableLight: true, editableDark: true },
  { key: "footerText",        cssVar: "--color-footer-text",        label: "Footer Text",     group: "footer",     fallbackChain: ["headerText"],                    editableLight: true, editableDark: true },

  { key: "linkColor",         cssVar: "--color-link",               label: "Link",            group: "links",      fallbackChain: ["primaryColor"],                  editableLight: true, editableDark: true, darkMinContrast: true, lightMinContrast: true },
];

const TOKEN_BY_KEY = new Map(THEME_TOKENS.map((t) => [t.key, t]));

/**
 * Global colours from globals.css (success, error) that a store's theme may set
 * explicitly (light and/or `dark`); an explicit value wins. Not editable in the admin.
 * Used to keep pre-redesign values on existing stores (scripts/pin-legacy-theme-defaults.ts).
 */
export const PINNABLE_DERIVED_TOKENS = [
  { key: "successColor", cssVar: "--color-success" },
  { key: "errorColor", cssVar: "--color-error" },
] as const;

export type PinnableDerivedKey = (typeof PINNABLE_DERIVED_TOKENS)[number]["key"];

export type ThemeColorMode = "light" | "dark";

type ThemeLike = Partial<IStoreTheme> & { dark?: Partial<IStoreDarkTheme> };

function readField(
  theme: ThemeLike,
  key: string,
  mode: ThemeColorMode
): string | undefined {
  const raw =
    mode === "dark"
      ? (theme.dark as Record<string, unknown> | undefined)?.[key]
      : (theme as Record<string, unknown>)[key];
  if (typeof raw === "string" && raw.length > 0) return raw;
  return undefined;
}

// ── Contrast helpers (WCAG 2.x relative luminance) ─────────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const ON_LIGHT = "#111827";
const ON_DARK = "#FFFFFF";

/** White or near-black, whichever reads better on `bg`. Non-hex values fall back to white. */
export function readableTextOn(bg: string): string {
  const white = contrastRatio(ON_DARK, bg);
  const dark = contrastRatio(ON_LIGHT, bg);
  if (white === null || dark === null) return ON_DARK;
  return white >= dark ? ON_DARK : ON_LIGHT;
}

/** Mix `hex` toward white until it reaches `min` contrast on every bg (or is white). */
function lightenToContrast(hex: string, bgs: string[], min = 4.5): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const mixed =
      "#" + rgb.map((v) => Math.round(v + (255 - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
    if (bgs.every((bg) => (contrastRatio(mixed, bg) ?? 21) >= min)) return mixed;
  }
  return "#FFFFFF";
}

function resolveValue(
  theme: ThemeLike,
  token: ThemeTokenDef,
  mode: ThemeColorMode
): string {
  const direct = readField(theme, token.key, mode);
  if (direct) return direct;

  const value = resolveBase(theme, token, mode);

  // Store left this token on auto in dark mode: brand colours picked for a light page are
  // often too dark on #111827 — lighten until they read (≥ 4.5:1 on bg and surface).
  if (mode === "dark" && token.darkMinContrast) {
    const bgs = ["backgroundColor", "surfaceColor"]
      .map((k) => TOKEN_BY_KEY.get(k))
      .filter((t): t is ThemeTokenDef => !!t)
      .map((t) => resolveValue(theme, t, mode));
    return lightenToContrast(value, bgs);
  }
  // Same idea for light mode: a link/price inherited from a mid-tone brand colour
  // (e.g. emerald #059669 = 3.8:1 on white) is darkened until it reads as text.
  if (mode === "light" && token.lightMinContrast) {
    const bgs = ["backgroundColor", "surfaceColor", "cardBg"]
      .map((k) => TOKEN_BY_KEY.get(k))
      .filter((t): t is ThemeTokenDef => !!t)
      .map((t) => resolveValue(theme, t, mode));
    return darkenToContrast(value, bgs);
  }
  return value;
}

/** Mix `hex` toward black until it reaches `min` contrast on every bg. */
function darkenToContrast(hex: string, bgs: string[], min = 4.5): string {
  const rgb = hexToRgb(hex);
  if (!rgb || bgs.some((bg) => !hexToRgb(bg))) return hex;
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const mixed =
      "#" + rgb.map((v) => Math.round(v * (1 - t)).toString(16).padStart(2, "0")).join("").toUpperCase();
    if (bgs.every((bg) => (contrastRatio(mixed, bg) ?? 21) >= min)) return t === 0 ? hex : mixed;
  }
  return ON_LIGHT;
}

/** Resolution without the explicit value or contrast adjustments. */
function resolveBase(
  theme: ThemeLike,
  token: ThemeTokenDef,
  mode: ThemeColorMode
): string {
  if (token.readableOn) {
    const on = TOKEN_BY_KEY.get(token.readableOn);
    if (on) return readableTextOn(resolveValue(theme, on, mode));
  }

  if (token.fallbackChain) {
    for (const fk of token.fallbackChain) {
      const dep = TOKEN_BY_KEY.get(fk);
      if (!dep) continue;
      // Follow what the dependency resolves to in *this* mode. Reading its raw light value
      // first gave dark mode light colours (e.g. white cards on a #111827 page).
      const fromDep = resolveValue(theme, dep, mode);
      if (fromDep) return fromDep;
    }
  }

  if (mode === "dark") {
    if (token.darkDefault) return token.darkDefault;
    const lightDirect = readField(theme, token.key, "light");
    if (lightDirect) return lightDirect;
  }
  return token.lightDefault ?? "";
}

export function resolveThemeVars(
  theme: ThemeLike,
  mode: ThemeColorMode
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const token of THEME_TOKENS) {
    out[token.cssVar] = resolveValue(theme, token, mode);
  }
  // Text/icon colour on brand-filled surfaces (buttons, badges): derived, not editable.
  out["--color-on-primary"] = readableTextOn(out["--color-primary"]);
  out["--color-on-accent"] = readableTextOn(out["--color-accent"]);

  // Muted text tiers, derived from the store's own text + page colours so they keep
  // the palette's warmth AND clear WCAG AA on every page surface. The old static greys
  // (#6B7280 / #9CA3AF) measured 4.18:1 and 2.37:1 on a warm ivory store.
  const pageBgs = [out["--color-bg"], out["--color-surface"], out["--color-card-bg"]];
  // Dark mode: blend toward a mid-tone of the page's own hue (navy page → slate-navy
  // greys) rather than toward the near-black bg, which only greyed a warm text colour
  // out into neutral beige-grey that read as "not part of the night palette".
  const mutedToward =
    mode === "dark" ? hueMidTone(out["--color-bg"]) ?? out["--color-bg"] : out["--color-bg"];
  const secondary = mixTowardUntilContrast(out["--color-text"], mutedToward, pageBgs, 5.5);
  const tertiary = mixTowardUntilContrast(out["--color-text"], mutedToward, pageBgs, 4.6);
  // Hero scrim base: the darkest brand colour available, so text over video stays
  // legible whether the store's header is dark or light.
  const scrimCandidates = [
    out["--color-header-bg"],
    out["--color-footer-bg"],
    out["--color-secondary"],
    out["--color-text"],
    out["--color-bg"],
  ].filter((c) => luminance(c) !== null);
  if (scrimCandidates.length) {
    out["--color-scrim"] = scrimCandidates.reduce((a, b) =>
      (luminance(b) ?? 1) < (luminance(a) ?? 1) ? b : a
    );
  }

  // Star ratings: the accent if it reads as a graphic on cards (≥ 3:1), else amber.
  // Pale accents (e.g. #DBEAFE) made stars invisible on white cards.
  const ratingFallback = mode === "dark" ? "#FBBF24" : "#B45309";
  out["--color-rating"] =
    (contrastRatio(out["--color-accent"], out["--color-card-bg"]) ?? 0) >= 3
      ? out["--color-accent"]
      : ratingFallback;
  // Form-control outline: WCAG 1.4.11 wants ≥ 3:1 against the page/card it sits on.
  // The hairline border token (~1.3:1) is too faint to identify an input by.
  const inputBorder = mixTowardUntilContrast(out["--color-text"], mutedToward, pageBgs, 3);
  if (inputBorder) out["--color-input-border"] = inputBorder;
  if (secondary) out["--color-text-secondary"] = secondary;
  if (tertiary) out["--color-text-tertiary"] = tertiary;

  // Explicit per-store success/error colours win (see PINNABLE_DERIVED_TOKENS).
  for (const { key, cssVar } of PINNABLE_DERIVED_TOKENS) {
    const pinned = readField(theme, key, mode);
    if (pinned) out[cssVar] = pinned;
  }
  // An explicit hero scrim colour (e.g. from a Theme Preset) wins over the derived one.
  const heroScrim = readField(theme, "heroScrim", mode);
  if (heroScrim) out["--color-scrim"] = heroScrim;
  return out;
}

/**
 * Blend `fg` toward `toward` as far as possible while staying ≥ `min` contrast on
 * every bg. Returns null for non-hex inputs (caller keeps the CSS defaults).
 */
function mixTowardUntilContrast(
  fg: string,
  toward: string,
  bgs: string[],
  min: number
): string | null {
  const a = hexToRgb(fg);
  const b = hexToRgb(toward);
  if (!a || !b || bgs.some((bg) => !hexToRgb(bg))) return null;
  let best = fg.toUpperCase();
  for (let t = 0; t <= 0.9001; t += 0.02) {
    const mixed =
      "#" +
      a
        .map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
    if (bgs.every((bg) => (contrastRatio(mixed, bg) ?? 0) >= min)) best = mixed;
    else break;
  }
  return best;
}

/**
 * The colour's hue at a mid lightness with restrained saturation, e.g. #0A1020 (navy)
 * → a slate-navy. Null for non-hex input or a hueless (grey) colour.
 */
function hueMidTone(hex: string): string | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d < 0.02) return null;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  const l0 = (max + min) / 2;
  const s0 = d / (1 - Math.abs(2 * l0 - 1));
  const s = Math.min(s0, 0.2);
  const l = 0.5;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return (
    "#" +
    [r1, g1, b1]
      .map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function buildDarkCss(darkVars: Record<string, string>): string {
  const lines = Object.entries(darkVars).map(
    ([cssVar, value]) => `  ${cssVar}: ${value} !important;`
  );
  // Dark-mode muted text: derived per store in resolveThemeVars; static fallback only
  // if derivation was impossible (non-hex colours).
  if (!darkVars["--color-text-secondary"]) lines.push("  --color-text-secondary: #E5E7EB !important;");
  if (!darkVars["--color-text-tertiary"]) lines.push("  --color-text-tertiary: #D1D5DB !important;");
  return `html.dark {\n${lines.join("\n")}\n}`;
}

export function getDefaultLightTheme(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const token of THEME_TOKENS) {
    out[token.key] = token.lightDefault;
  }
  return out;
}

export function getDefaultDarkTheme(): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const token of THEME_TOKENS) {
    out[token.key] = token.darkDefault;
  }
  return out;
}

export function getThemeColorKeys(): string[] {
  return THEME_TOKENS.map((t) => t.key);
}

export function getTokensByGroup(): Record<ThemeTokenGroup, ThemeTokenDef[]> {
  const groups = {} as Record<ThemeTokenGroup, ThemeTokenDef[]>;
  for (const g of Object.keys(THEME_TOKEN_GROUPS) as ThemeTokenGroup[]) {
    groups[g] = [];
  }
  for (const token of THEME_TOKENS) {
    groups[token.group].push(token);
  }
  return groups;
}

// ─── Preset palettes ──────────────────────────────────────────────
// Curated theme presets. Click in admin → applies to all color fields.
// Non-color fields (fontFamily, borderRadius, layoutStyle) untouched.
// Each preset must cover every editable token; missing ones fall back
// to registry defaults via `resolveValue`.

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  light: Partial<Record<string, string>>;
  dark: Partial<Record<string, string>>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "indigo-modern",
    name: "Indigo Modern",
    description: "Crisp, neutral, conversion-friendly default.",
    light: {
      primaryColor: "#4F46E5",
      secondaryColor: "#10B981",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
      textColor: "#0F172A",
      surfaceColor: "#F8FAFC",
      borderColor: "#E2E8F0",
      headerBg: "#0F172A",
      headerText: "#FFFFFF",
      cardBg: "#FFFFFF",
      newsletterBg: "#4F46E5",
      newsletterText: "#FFFFFF",
      newsletterBtnBg: "#FFFFFF",
      newsletterBtnText: "#4F46E5",
      priceColor: "#4F46E5",
      saleBadgeBg: "#DC2626",
      saleBadgeText: "#FFFFFF",
      footerBg: "#0F172A",
      footerText: "#CBD5E1",
      linkColor: "#4F46E5",
    },
    dark: {
      primaryColor: "#818CF8",
      secondaryColor: "#34D399",
      accentColor: "#FBBF24",
      backgroundColor: "#0B1220",
      textColor: "#F8FAFC",
      surfaceColor: "#111827",
      borderColor: "#1F2937",
      headerBg: "#020617",
      headerText: "#F8FAFC",
      cardBg: "#111827",
      newsletterBg: "#1E1B4B",
      newsletterText: "#E0E7FF",
      newsletterBtnBg: "#818CF8",
      newsletterBtnText: "#0B1220",
      priceColor: "#A5B4FC",
      saleBadgeBg: "#DC2626",
      saleBadgeText: "#FFFFFF",
      footerBg: "#020617",
      footerText: "#94A3B8",
      linkColor: "#A5B4FC",
    },
  },
  {
    id: "rose-elegant",
    name: "Rose Elegant",
    description: "Soft fashion / lifestyle palette.",
    light: {
      primaryColor: "#E11D48",
      secondaryColor: "#F472B6",
      accentColor: "#FBBF24",
      backgroundColor: "#FFF1F2",
      textColor: "#1F2937",
      surfaceColor: "#FFE4E6",
      borderColor: "#FECDD3",
      headerBg: "#881337",
      headerText: "#FFF1F2",
      cardBg: "#FFFFFF",
      newsletterBg: "#E11D48",
      newsletterText: "#FFFFFF",
      newsletterBtnBg: "#FFFFFF",
      newsletterBtnText: "#E11D48",
      priceColor: "#E11D48",
      saleBadgeBg: "#BE123C",
      saleBadgeText: "#FFFFFF",
      footerBg: "#881337",
      footerText: "#FECDD3",
      linkColor: "#E11D48",
    },
    dark: {
      primaryColor: "#FB7185",
      secondaryColor: "#F9A8D4",
      accentColor: "#FCD34D",
      backgroundColor: "#1A0B10",
      textColor: "#FCE7F3",
      surfaceColor: "#2A1117",
      borderColor: "#4C1D24",
      headerBg: "#0F0408",
      headerText: "#FCE7F3",
      cardBg: "#2A1117",
      newsletterBg: "#4C1D24",
      newsletterText: "#FCE7F3",
      newsletterBtnBg: "#FB7185",
      newsletterBtnText: "#1A0B10",
      priceColor: "#FB7185",
      saleBadgeBg: "#9F1239",
      saleBadgeText: "#FFFFFF",
      footerBg: "#0F0408",
      footerText: "#9F1239",
      linkColor: "#FB7185",
    },
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    description: "Organic / wellness greens.",
    light: {
      primaryColor: "#059669",
      secondaryColor: "#0D9488",
      accentColor: "#84CC16",
      backgroundColor: "#F0FDF4",
      textColor: "#0F172A",
      surfaceColor: "#DCFCE7",
      borderColor: "#BBF7D0",
      headerBg: "#064E3B",
      headerText: "#ECFCCB",
      cardBg: "#FFFFFF",
      newsletterBg: "#059669",
      newsletterText: "#FFFFFF",
      newsletterBtnBg: "#FFFFFF",
      newsletterBtnText: "#059669",
      priceColor: "#047857",
      saleBadgeBg: "#DC2626",
      saleBadgeText: "#FFFFFF",
      footerBg: "#064E3B",
      footerText: "#A7F3D0",
      linkColor: "#059669",
    },
    dark: {
      primaryColor: "#34D399",
      secondaryColor: "#2DD4BF",
      accentColor: "#A3E635",
      backgroundColor: "#04130C",
      textColor: "#ECFDF5",
      surfaceColor: "#0A2118",
      borderColor: "#14532D",
      headerBg: "#020A06",
      headerText: "#ECFDF5",
      cardBg: "#0A2118",
      newsletterBg: "#064E3B",
      newsletterText: "#ECFDF5",
      newsletterBtnBg: "#34D399",
      newsletterBtnText: "#04130C",
      priceColor: "#6EE7B7",
      saleBadgeBg: "#B91C1C",
      saleBadgeText: "#FFFFFF",
      footerBg: "#020A06",
      footerText: "#6EE7B7",
      linkColor: "#34D399",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    description: "Cool, trustworthy blues.",
    light: {
      primaryColor: "#0EA5E9",
      secondaryColor: "#06B6D4",
      accentColor: "#F97316",
      backgroundColor: "#F0F9FF",
      textColor: "#0F172A",
      surfaceColor: "#E0F2FE",
      borderColor: "#BAE6FD",
      headerBg: "#0C4A6E",
      headerText: "#F0F9FF",
      cardBg: "#FFFFFF",
      newsletterBg: "#0EA5E9",
      newsletterText: "#FFFFFF",
      newsletterBtnBg: "#FFFFFF",
      newsletterBtnText: "#0EA5E9",
      priceColor: "#0284C7",
      saleBadgeBg: "#F97316",
      saleBadgeText: "#FFFFFF",
      footerBg: "#0C4A6E",
      footerText: "#BAE6FD",
      linkColor: "#0EA5E9",
    },
    dark: {
      primaryColor: "#38BDF8",
      secondaryColor: "#22D3EE",
      accentColor: "#FB923C",
      backgroundColor: "#020A14",
      textColor: "#F0F9FF",
      surfaceColor: "#0C1B2E",
      borderColor: "#1E3A5F",
      headerBg: "#010613",
      headerText: "#F0F9FF",
      cardBg: "#0C1B2E",
      newsletterBg: "#0C4A6E",
      newsletterText: "#F0F9FF",
      newsletterBtnBg: "#38BDF8",
      newsletterBtnText: "#020A14",
      priceColor: "#7DD3FC",
      saleBadgeBg: "#EA580C",
      saleBadgeText: "#FFFFFF",
      footerBg: "#010613",
      footerText: "#7DD3FC",
      linkColor: "#38BDF8",
    },
  },
  {
    id: "warm-earth",
    name: "Warm Earth",
    description: "Cozy artisan / craft tones.",
    light: {
      primaryColor: "#D97706",
      secondaryColor: "#92400E",
      accentColor: "#EAB308",
      backgroundColor: "#FFFBEB",
      textColor: "#1C1917",
      surfaceColor: "#FEF3C7",
      borderColor: "#FDE68A",
      headerBg: "#451A03",
      headerText: "#FEF3C7",
      cardBg: "#FFFFFF",
      newsletterBg: "#D97706",
      newsletterText: "#FFFFFF",
      newsletterBtnBg: "#FFFFFF",
      newsletterBtnText: "#D97706",
      priceColor: "#B45309",
      saleBadgeBg: "#B91C1C",
      saleBadgeText: "#FFFFFF",
      footerBg: "#451A03",
      footerText: "#FDE68A",
      linkColor: "#D97706",
    },
    dark: {
      primaryColor: "#FBBF24",
      secondaryColor: "#F59E0B",
      accentColor: "#FACC15",
      backgroundColor: "#1C1208",
      textColor: "#FEF3C7",
      surfaceColor: "#2C1A0B",
      borderColor: "#451A03",
      headerBg: "#0E0904",
      headerText: "#FEF3C7",
      cardBg: "#2C1A0B",
      newsletterBg: "#451A03",
      newsletterText: "#FEF3C7",
      newsletterBtnBg: "#FBBF24",
      newsletterBtnText: "#1C1208",
      priceColor: "#FCD34D",
      saleBadgeBg: "#991B1B",
      saleBadgeText: "#FFFFFF",
      footerBg: "#0E0904",
      footerText: "#FCD34D",
      linkColor: "#FBBF24",
    },
  },
  {
    id: "slate-minimal",
    name: "Slate Minimal",
    description: "Pro SaaS neutral. Restrained, low-strain.",
    light: {
      primaryColor: "#475569",
      secondaryColor: "#64748B",
      accentColor: "#0EA5E9",
      backgroundColor: "#F8FAFC",
      textColor: "#1E293B",
      surfaceColor: "#F1F5F9",
      borderColor: "#E2E8F0",
      headerBg: "#1E293B",
      headerText: "#F1F5F9",
      cardBg: "#FFFFFF",
      newsletterBg: "#334155",
      newsletterText: "#F1F5F9",
      newsletterBtnBg: "#0EA5E9",
      newsletterBtnText: "#FFFFFF",
      priceColor: "#0F172A",
      saleBadgeBg: "#DC2626",
      saleBadgeText: "#FFFFFF",
      footerBg: "#1E293B",
      footerText: "#94A3B8",
      linkColor: "#0EA5E9",
    },
    dark: {
      primaryColor: "#94A3B8",
      secondaryColor: "#CBD5E1",
      accentColor: "#38BDF8",
      backgroundColor: "#0B1220",
      textColor: "#E2E8F0",
      surfaceColor: "#111827",
      borderColor: "#1F2937",
      headerBg: "#020617",
      headerText: "#E2E8F0",
      cardBg: "#111827",
      newsletterBg: "#1E293B",
      newsletterText: "#E2E8F0",
      newsletterBtnBg: "#38BDF8",
      newsletterBtnText: "#0B1220",
      priceColor: "#E2E8F0",
      saleBadgeBg: "#B91C1C",
      saleBadgeText: "#FFFFFF",
      footerBg: "#020617",
      footerText: "#64748B",
      linkColor: "#38BDF8",
    },
  },
  {
    id: "sage-linen",
    name: "Sage Linen",
    description: "Soft sage on warm linen. Calming, low-glare.",
    light: {
      primaryColor: "#6B8E5A",
      secondaryColor: "#A4B494",
      accentColor: "#C9885A",
      backgroundColor: "#FAF7F0",
      textColor: "#3F4A36",
      surfaceColor: "#F0EDE3",
      borderColor: "#DDD8C8",
      headerBg: "#3F4A36",
      headerText: "#FAF7F0",
      cardBg: "#FFFEF9",
      newsletterBg: "#6B8E5A",
      newsletterText: "#FAF7F0",
      newsletterBtnBg: "#FAF7F0",
      newsletterBtnText: "#3F4A36",
      priceColor: "#5A7349",
      saleBadgeBg: "#B45A3C",
      saleBadgeText: "#FAF7F0",
      footerBg: "#3F4A36",
      footerText: "#C5BFA8",
      linkColor: "#6B8E5A",
    },
    dark: {
      primaryColor: "#A4B494",
      secondaryColor: "#C5D1B5",
      accentColor: "#E0A278",
      backgroundColor: "#0F140C",
      textColor: "#E8E3D5",
      surfaceColor: "#1A1F15",
      borderColor: "#2C3325",
      headerBg: "#080B05",
      headerText: "#E8E3D5",
      cardBg: "#1A1F15",
      newsletterBg: "#2C3325",
      newsletterText: "#E8E3D5",
      newsletterBtnBg: "#A4B494",
      newsletterBtnText: "#0F140C",
      priceColor: "#C5D1B5",
      saleBadgeBg: "#9B4A2F",
      saleBadgeText: "#E8E3D5",
      footerBg: "#080B05",
      footerText: "#7A8470",
      linkColor: "#A4B494",
    },
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    description: "Soft lavender + dove gray. Tender, premium.",
    light: {
      primaryColor: "#8B7AB8",
      secondaryColor: "#B8A9D6",
      accentColor: "#E5B8C5",
      backgroundColor: "#FBF9FC",
      textColor: "#2E2940",
      surfaceColor: "#F2EEF5",
      borderColor: "#E5DFEB",
      headerBg: "#2E2940",
      headerText: "#FBF9FC",
      cardBg: "#FFFFFF",
      newsletterBg: "#8B7AB8",
      newsletterText: "#FBF9FC",
      newsletterBtnBg: "#FBF9FC",
      newsletterBtnText: "#5B4D85",
      priceColor: "#5B4D85",
      saleBadgeBg: "#C44569",
      saleBadgeText: "#FFFFFF",
      footerBg: "#2E2940",
      footerText: "#B8A9D6",
      linkColor: "#8B7AB8",
    },
    dark: {
      primaryColor: "#B8A9D6",
      secondaryColor: "#D1C5E5",
      accentColor: "#F5C8D5",
      backgroundColor: "#13101A",
      textColor: "#EDE6F5",
      surfaceColor: "#1F1A2C",
      borderColor: "#332C45",
      headerBg: "#0A0810",
      headerText: "#EDE6F5",
      cardBg: "#1F1A2C",
      newsletterBg: "#332C45",
      newsletterText: "#EDE6F5",
      newsletterBtnBg: "#B8A9D6",
      newsletterBtnText: "#13101A",
      priceColor: "#D1C5E5",
      saleBadgeBg: "#A03654",
      saleBadgeText: "#FFFFFF",
      footerBg: "#0A0810",
      footerText: "#8B7AB8",
      linkColor: "#B8A9D6",
    },
  },
  {
    id: "plum-noir",
    name: "Plum Noir",
    description: "Deep plum on warm cream. Editorial, refined.",
    light: {
      primaryColor: "#5B2C4F",
      secondaryColor: "#8E4B7A",
      accentColor: "#D4A574",
      backgroundColor: "#FAF6F2",
      textColor: "#2A1925",
      surfaceColor: "#F0E8E2",
      borderColor: "#E0D3CA",
      headerBg: "#2A1925",
      headerText: "#FAF6F2",
      cardBg: "#FFFFFF",
      newsletterBg: "#5B2C4F",
      newsletterText: "#FAF6F2",
      newsletterBtnBg: "#D4A574",
      newsletterBtnText: "#2A1925",
      priceColor: "#5B2C4F",
      saleBadgeBg: "#8B2D2D",
      saleBadgeText: "#FAF6F2",
      footerBg: "#2A1925",
      footerText: "#C9A584",
      linkColor: "#5B2C4F",
    },
    dark: {
      primaryColor: "#B97FA0",
      secondaryColor: "#D6A0BD",
      accentColor: "#E5BD8E",
      backgroundColor: "#150A12",
      textColor: "#F0E2EB",
      surfaceColor: "#1F141C",
      borderColor: "#3A2434",
      headerBg: "#0A0508",
      headerText: "#F0E2EB",
      cardBg: "#1F141C",
      newsletterBg: "#3A2434",
      newsletterText: "#F0E2EB",
      newsletterBtnBg: "#E5BD8E",
      newsletterBtnText: "#150A12",
      priceColor: "#D6A0BD",
      saleBadgeBg: "#7A2424",
      saleBadgeText: "#F0E2EB",
      footerBg: "#0A0508",
      footerText: "#8B5C76",
      linkColor: "#B97FA0",
    },
  },
  {
    id: "sand-sea",
    name: "Sand & Sea",
    description: "Sandy beige + deep teal. Coastal, breezy.",
    light: {
      primaryColor: "#1F6E7A",
      secondaryColor: "#4A8A8F",
      accentColor: "#E2B57F",
      backgroundColor: "#FBF6EC",
      textColor: "#1F2D32",
      surfaceColor: "#F0E8D4",
      borderColor: "#DDD0B5",
      headerBg: "#1F2D32",
      headerText: "#FBF6EC",
      cardBg: "#FFFCF5",
      newsletterBg: "#1F6E7A",
      newsletterText: "#FBF6EC",
      newsletterBtnBg: "#E2B57F",
      newsletterBtnText: "#1F2D32",
      priceColor: "#1F6E7A",
      saleBadgeBg: "#C0613A",
      saleBadgeText: "#FBF6EC",
      footerBg: "#1F2D32",
      footerText: "#C5BFA8",
      linkColor: "#1F6E7A",
    },
    dark: {
      primaryColor: "#5DAFB8",
      secondaryColor: "#8DC3C8",
      accentColor: "#F0CB94",
      backgroundColor: "#0A1416",
      textColor: "#E8DCC4",
      surfaceColor: "#152326",
      borderColor: "#1F3438",
      headerBg: "#040A0B",
      headerText: "#E8DCC4",
      cardBg: "#152326",
      newsletterBg: "#1F3438",
      newsletterText: "#E8DCC4",
      newsletterBtnBg: "#F0CB94",
      newsletterBtnText: "#0A1416",
      priceColor: "#8DC3C8",
      saleBadgeBg: "#A04A2A",
      saleBadgeText: "#E8DCC4",
      footerBg: "#040A0B",
      footerText: "#7A9B9F",
      linkColor: "#5DAFB8",
    },
  },
  {
    id: "pearl-burgundy",
    name: "Pearl Burgundy",
    description: "Wine red on pearl ivory. Luxury, formal.",
    light: {
      primaryColor: "#7A1F2C",
      secondaryColor: "#A03A48",
      accentColor: "#C9A55A",
      backgroundColor: "#FAF7F2",
      textColor: "#2A1A1D",
      surfaceColor: "#F0EBE2",
      borderColor: "#DDD3C3",
      headerBg: "#2A1A1D",
      headerText: "#FAF7F2",
      cardBg: "#FFFCF7",
      newsletterBg: "#7A1F2C",
      newsletterText: "#FAF7F2",
      newsletterBtnBg: "#C9A55A",
      newsletterBtnText: "#2A1A1D",
      priceColor: "#7A1F2C",
      saleBadgeBg: "#5B0F1A",
      saleBadgeText: "#FAF7F2",
      footerBg: "#2A1A1D",
      footerText: "#C9A55A",
      linkColor: "#7A1F2C",
    },
    dark: {
      primaryColor: "#C44A5A",
      secondaryColor: "#D86A78",
      accentColor: "#E5C078",
      backgroundColor: "#140A0C",
      textColor: "#F0E2DC",
      surfaceColor: "#1F1213",
      borderColor: "#3A1F23",
      headerBg: "#0A0405",
      headerText: "#F0E2DC",
      cardBg: "#1F1213",
      newsletterBg: "#3A1F23",
      newsletterText: "#F0E2DC",
      newsletterBtnBg: "#E5C078",
      newsletterBtnText: "#140A0C",
      priceColor: "#D86A78",
      saleBadgeBg: "#9B1F2C",
      saleBadgeText: "#F0E2DC",
      footerBg: "#0A0405",
      footerText: "#A57078",
      linkColor: "#C44A5A",
    },
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    description: "Pale ice blue + soft gray. Minimal, airy.",
    light: {
      primaryColor: "#3D7A9E",
      secondaryColor: "#7AAAC4",
      accentColor: "#E8A87C",
      backgroundColor: "#F5F8FA",
      textColor: "#1F2D3D",
      surfaceColor: "#E8EEF2",
      borderColor: "#D4DCE2",
      headerBg: "#1F2D3D",
      headerText: "#F5F8FA",
      cardBg: "#FFFFFF",
      newsletterBg: "#3D7A9E",
      newsletterText: "#F5F8FA",
      newsletterBtnBg: "#F5F8FA",
      newsletterBtnText: "#3D7A9E",
      priceColor: "#3D7A9E",
      saleBadgeBg: "#C44A2A",
      saleBadgeText: "#F5F8FA",
      footerBg: "#1F2D3D",
      footerText: "#A4B5C4",
      linkColor: "#3D7A9E",
    },
    dark: {
      primaryColor: "#7AAAC4",
      secondaryColor: "#A4C5D6",
      accentColor: "#F0BC95",
      backgroundColor: "#0A1218",
      textColor: "#E0E8F0",
      surfaceColor: "#141E26",
      borderColor: "#1F2D3D",
      headerBg: "#040810",
      headerText: "#E0E8F0",
      cardBg: "#141E26",
      newsletterBg: "#1F2D3D",
      newsletterText: "#E0E8F0",
      newsletterBtnBg: "#7AAAC4",
      newsletterBtnText: "#0A1218",
      priceColor: "#A4C5D6",
      saleBadgeBg: "#9B3A1F",
      saleBadgeText: "#E0E8F0",
      footerBg: "#040810",
      footerText: "#5C7A95",
      linkColor: "#7AAAC4",
    },
  },
  {
    id: "charcoal-mint",
    name: "Charcoal Mint",
    description: "Charcoal text + mint accent. Modern tech.",
    light: {
      primaryColor: "#2D7A6E",
      secondaryColor: "#5BA89A",
      accentColor: "#E8D55A",
      backgroundColor: "#F7F8F7",
      textColor: "#1A2421",
      surfaceColor: "#EDF0EE",
      borderColor: "#D8DDDA",
      headerBg: "#1A2421",
      headerText: "#F7F8F7",
      cardBg: "#FFFFFF",
      newsletterBg: "#2D7A6E",
      newsletterText: "#F7F8F7",
      newsletterBtnBg: "#E8D55A",
      newsletterBtnText: "#1A2421",
      priceColor: "#2D7A6E",
      saleBadgeBg: "#C44A4A",
      saleBadgeText: "#F7F8F7",
      footerBg: "#1A2421",
      footerText: "#8FA89F",
      linkColor: "#2D7A6E",
    },
    dark: {
      primaryColor: "#5BC4B5",
      secondaryColor: "#8DD8CC",
      accentColor: "#F0DC78",
      backgroundColor: "#0A1311",
      textColor: "#E0EDE8",
      surfaceColor: "#141F1C",
      borderColor: "#1F2D2A",
      headerBg: "#040806",
      headerText: "#E0EDE8",
      cardBg: "#141F1C",
      newsletterBg: "#1F3D38",
      newsletterText: "#E0EDE8",
      newsletterBtnBg: "#5BC4B5",
      newsletterBtnText: "#0A1311",
      priceColor: "#8DD8CC",
      saleBadgeBg: "#A03A3A",
      saleBadgeText: "#E0EDE8",
      footerBg: "#040806",
      footerText: "#5C8077",
      linkColor: "#5BC4B5",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Deep navy + champagne gold. Premium, evening.",
    light: {
      primaryColor: "#1E3A5F",
      secondaryColor: "#3D5A7A",
      accentColor: "#C9A35A",
      backgroundColor: "#F8F6F0",
      textColor: "#0F1F33",
      surfaceColor: "#EDE9DD",
      borderColor: "#DDD7C5",
      headerBg: "#0F1F33",
      headerText: "#F8F6F0",
      cardBg: "#FFFCF5",
      newsletterBg: "#1E3A5F",
      newsletterText: "#F8F6F0",
      newsletterBtnBg: "#C9A35A",
      newsletterBtnText: "#0F1F33",
      priceColor: "#1E3A5F",
      saleBadgeBg: "#9B2D2D",
      saleBadgeText: "#F8F6F0",
      footerBg: "#0F1F33",
      footerText: "#C9A35A",
      linkColor: "#1E3A5F",
    },
    dark: {
      primaryColor: "#5C8AB8",
      secondaryColor: "#8DAFD1",
      accentColor: "#E5C078",
      backgroundColor: "#0A1018",
      textColor: "#EDE9DD",
      surfaceColor: "#131C2A",
      borderColor: "#1F2D40",
      headerBg: "#040810",
      headerText: "#EDE9DD",
      cardBg: "#131C2A",
      newsletterBg: "#1F2D40",
      newsletterText: "#EDE9DD",
      newsletterBtnBg: "#E5C078",
      newsletterBtnText: "#0A1018",
      priceColor: "#8DAFD1",
      saleBadgeBg: "#7A1F1F",
      saleBadgeText: "#EDE9DD",
      footerBg: "#040810",
      footerText: "#A58A5A",
      linkColor: "#5C8AB8",
    },
  },
];

// Returns ordered list of "swatch" colors for a preset card preview.
export function getPresetSwatches(preset: ThemePreset): string[] {
  return [
    preset.light.primaryColor ?? "",
    preset.light.secondaryColor ?? "",
    preset.light.accentColor ?? "",
    preset.light.headerBg ?? "",
    preset.light.backgroundColor ?? "",
  ].filter(Boolean);
}

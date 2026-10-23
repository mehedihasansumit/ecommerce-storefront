import {
  THEME_TOKENS,
  resolveThemeVars,
  type ThemeColorMode,
  type ThemeTokenDef,
} from "./theme-tokens";
import type { IStoreDarkTheme, IStoreTheme } from "./types";

/**
 * Colour resolution as it was before the storefront redesign (commit 3e1b02b).
 * Existing stores keep their old success, error and sale-badge colours; every other
 * colour takes the new contrast-safe value. Pure: no DB access. Used by
 * scripts/pin-legacy-theme-defaults.ts.
 *
 * A first version of the script pinned every changed colour (on-primary, muted text,
 * card/surface, link, price...). That turned old contrast bugs back on (white cards in
 * dark mode, white text on a gold button), so it was narrowed;
 * computeDroppedLegacyPins() finds what that version wrote so it can be removed.
 */

type ThemeLike = Partial<IStoreTheme> & { dark?: Partial<IStoreDarkTheme> };
export type ThemePins = { light: Record<string, string>; dark: Record<string, string> };

/** The only colours still pinned on existing stores. */
export const LEGACY_PINNED_KEYS: ReadonlySet<string> = new Set([
  "successColor",
  "errorColor",
  "saleBadgeBg",
  "saleBadgeText",
]);

/** Token defaults that changed in the redesign (everything else kept its default). */
const LEGACY_DEFAULT_OVERRIDES: Record<string, Partial<Pick<ThemeTokenDef, "lightDefault" | "darkDefault">>> = {
  saleBadgeBg: { lightDefault: "#EF4444", darkDefault: "#DC2626" },
};

/** Pre-redesign values of derived/global colours (globals.css + component fallbacks). */
const LEGACY_DERIVED: Record<ThemeColorMode, Record<string, string>> = {
  light: {
    onPrimaryColor: "#FFFFFF",
    onAccentColor: "#FFFFFF",
    textSecondaryColor: "#6B7280",
    textTertiaryColor: "#9CA3AF",
    successColor: "#10B981",
    errorColor: "#EF4444",
  },
  dark: {
    onPrimaryColor: "#FFFFFF",
    onAccentColor: "#FFFFFF",
    textSecondaryColor: "#E5E7EB",
    textTertiaryColor: "#D1D5DB",
    successColor: "#10B981",
    errorColor: "#EF4444",
  },
};

/** Derived/global colours the first version compared (key, emitted CSS var). */
const V1_DERIVED = [
  { key: "onPrimaryColor", cssVar: "--color-on-primary" },
  { key: "onAccentColor", cssVar: "--color-on-accent" },
  { key: "textSecondaryColor", cssVar: "--color-text-secondary" },
  { key: "textTertiaryColor", cssVar: "--color-text-tertiary" },
  { key: "successColor", cssVar: "--color-success" },
  { key: "errorColor", cssVar: "--color-error" },
] as const;

/** globals.css defaults for colours resolveThemeVars does not emit (keep in sync). */
const NEW_GLOBAL_DEFAULTS: Record<ThemeColorMode, Record<string, string>> = {
  light: { "--color-success": "#047857", "--color-error": "#B91C1C" },
  dark: { "--color-success": "#34D399", "--color-error": "#F87171" },
};

const LEGACY_TOKENS: ThemeTokenDef[] = THEME_TOKENS.map((t) => ({ ...t, ...LEGACY_DEFAULT_OVERRIDES[t.key] }));
const LEGACY_BY_KEY = new Map(LEGACY_TOKENS.map((t) => [t.key, t]));

function readField(theme: ThemeLike, key: string, mode: ThemeColorMode): string | undefined {
  const raw =
    mode === "dark"
      ? (theme.dark as Record<string, unknown> | undefined)?.[key]
      : (theme as Record<string, unknown>)[key];
  return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

/** Verbatim port of the 3e1b02b resolveValue (no contrast adjustment, no derived tokens). */
function legacyResolve(theme: ThemeLike, token: ThemeTokenDef, mode: ThemeColorMode): string {
  const direct = readField(theme, token.key, mode);
  if (direct) return direct;
  if (token.fallbackChain) {
    for (const fk of token.fallbackChain) {
      const dep = LEGACY_BY_KEY.get(fk);
      if (!dep) continue;
      const fromChain = readField(theme, fk, mode);
      if (fromChain) return fromChain;
      if (mode === "dark") {
        const fromLight = readField(theme, fk, "light");
        if (fromLight) return fromLight;
      }
      const depDefault = mode === "dark" ? dep.darkDefault ?? dep.lightDefault : dep.lightDefault;
      if (depDefault) return depDefault;
    }
  }
  if (mode === "dark") {
    if (token.darkDefault) return token.darkDefault;
    const lightDirect = readField(theme, token.key, "light");
    if (lightDirect) return lightDirect;
  }
  return token.lightDefault ?? "";
}

const same = (a: string | undefined, b: string | undefined) =>
  (a ?? "").trim().toUpperCase() === (b ?? "").trim().toUpperCase();

function withPins(theme: ThemeLike, pins: ThemePins): ThemeLike {
  return { ...theme, ...pins.light, dark: { ...theme.dark, ...pins.dark } };
}

const MODES: ThemeColorMode[] = ["light", "dark"];

/**
 * Every colour the store has not set itself whose resolution changed, with its old
 * value (the first version's full pin set).
 */
function computeAllLegacyPins(theme: ThemeLike): ThemePins {
  const pins: ThemePins = { light: {}, dark: {} };

  // Editable tokens. Pinning one token can change how others resolve (fallback chains),
  // so repeat until nothing else moves.
  for (let pass = 0; pass < 10; pass++) {
    const current = withPins(theme, pins);
    let changed = false;
    for (const mode of MODES) {
      const now = resolveThemeVars(current, mode);
      for (const token of LEGACY_TOKENS) {
        if (readField(current, token.key, mode)) continue;
        const before = legacyResolve(theme, token, mode);
        if (before && !same(before, now[token.cssVar])) {
          pins[mode][token.key] = before;
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  // Derived / global colours, compared against what the new code emits (derived
  // values, or the globals.css defaults for success/error).
  const current = withPins(theme, pins);
  for (const mode of MODES) {
    const now = resolveThemeVars(current, mode);
    for (const { key, cssVar } of V1_DERIVED) {
      if (readField(current, key, mode)) continue;
      const before = LEGACY_DERIVED[mode][key];
      const after = now[cssVar] ?? NEW_GLOBAL_DEFAULTS[mode][cssVar];
      if (!same(before, after)) pins[mode][key] = before;
    }
  }
  return pins;
}

function pick(pins: ThemePins, keep: (key: string) => boolean): ThemePins {
  const out: ThemePins = { light: {}, dark: {} };
  for (const mode of MODES) {
    for (const [k, v] of Object.entries(pins[mode])) if (keep(k)) out[mode][k] = v;
  }
  return out;
}

/**
 * Old success / error / sale-badge values to write into a store's theme, for the ones
 * the store has not set itself and whose value changed. Empty for an already-pinned
 * store (idempotent).
 */
export function computeLegacyThemePins(theme: ThemeLike): ThemePins {
  return pick(computeAllLegacyPins(theme), (k) => LEGACY_PINNED_KEYS.has(k));
}

function without(theme: ThemeLike, pins: ThemePins): ThemeLike {
  const light: Record<string, unknown> = { ...theme };
  const dark: Record<string, unknown> = { ...(theme.dark ?? {}) };
  for (const k of Object.keys(pins.light)) delete light[k];
  for (const k of Object.keys(pins.dark)) delete dark[k];
  return { ...(light as ThemeLike), dark: dark as Partial<IStoreDarkTheme> };
}

const DROPPED_KEYS = new Set(
  [...THEME_TOKENS.map((t) => t.key), ...V1_DERIVED.map((d) => d.key)].filter(
    (k) => !LEGACY_PINNED_KEYS.has(k)
  )
);

/**
 * Values the first version pinned for colours that are no longer pinned. A value is
 * returned only when it exactly equals what that version wrote for the store's
 * un-pinned theme, so colours the store (or an admin) set on purpose are kept.
 *
 * The un-pinned theme is not stored, so pins are found one at a time: a dropped key is a
 * first-version pin when removing it (plus the pins already found) makes that version
 * pin exactly the current value again. Repeats until no more pins are found.
 */
export function computeDroppedLegacyPins(theme: ThemeLike): ThemePins {
  const found: ThemePins = { light: {}, dark: {} };
  for (let pass = 0; pass < 20; pass++) {
    let grew = false;
    for (const mode of MODES) {
      for (const key of DROPPED_KEYS) {
        if (key in found[mode]) continue;
        const value = readField(theme, key, mode);
        if (!value) continue;
        const trial = pick(found, () => true);
        trial[mode][key] = value;
        const expected = computeAllLegacyPins(without(theme, trial));
        if (same(value, expected[mode][key])) {
          found[mode][key] = value;
          grew = true;
        }
      }
    }
    if (!grew) break;
  }
  return found;
}

/** The store theme with `pins` merged in (light keys top-level, dark keys under `dark`). */
export function applyThemePins<T extends ThemeLike>(theme: T, pins: ThemePins): T {
  return withPins(theme, pins) as T;
}

/** The store theme with the keys in `pins` removed (light top-level, dark under `dark`). */
export function removeThemePins<T extends ThemeLike>(theme: T, pins: ThemePins): T {
  return without(theme, pins) as T;
}

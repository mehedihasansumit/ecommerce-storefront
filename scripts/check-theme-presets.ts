/**
 * Assertions for the Theme Preset registry and resolveTheme (the repo has no test
 * runner). Run: npx tsx scripts/check-theme-presets.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  STORE_THEME_PRESETS,
  THEME_PRESET_IDS,
  resolveTheme,
} from "../src/features/stores/presets";
import { DEFAULT_STYLES, STYLE_SWITCHES, sanitizeStyles } from "../src/features/stores/styles";
import { STORE_FONTS, STORE_HEADING_FONTS } from "../src/shared/lib/fonts";
import { THEME_TOKENS, resolveThemeVars } from "../src/features/stores/theme-tokens";
import type { IStoreTheme } from "../src/features/stores/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const legacyStore: Partial<IStoreTheme> = {
  primaryColor: "#111111",
  fontFamily: "Poppins",
  borderRadius: "0.75rem",
  layoutStyle: "grid",
  saleBadgeBg: "#EF4444",
  successColor: "#10B981",
  dark: { backgroundColor: "#000000", errorColor: "#EF4444" },
};

check("no preset, no styles: base defaults, store values untouched", () => {
  const r = resolveTheme(legacyStore);
  assert.deepEqual(r.styles, DEFAULT_STYLES);
  assert.equal(r.primaryColor, "#111111");
  assert.equal(r.fontFamily, "Poppins");
  assert.equal(r.borderRadius, "0.75rem");
  assert.equal(r.backgroundPattern, "grid");
  assert.equal(r.headingFont, undefined);
  assert.equal(r.accentColor, undefined, "unset colours stay unset for the token registry");
  assert.deepEqual(r.dark, legacyStore.dark);
});

check("same CSS vars as before for a store without a preset", () => {
  for (const mode of ["light", "dark"] as const) {
    assert.deepEqual(resolveThemeVars(resolveTheme(legacyStore), mode), resolveThemeVars(legacyStore, mode));
  }
});

check("a store that only sets a preset gets the whole preset", () => {
  for (const id of THEME_PRESET_IDS) {
    const p = STORE_THEME_PRESETS[id];
    const r = resolveTheme({ preset: id });
    assert.equal(r.preset, id);
    assert.deepEqual(r.styles, p.styles);
    const { dark, ...light } = p.theme;
    for (const [k, v] of Object.entries(light)) assert.equal((r as unknown as Record<string, unknown>)[k], v, `${id}.${k}`);
    for (const [k, v] of Object.entries(dark)) assert.equal((r.dark as Record<string, unknown>)[k], v, `${id}.dark.${k}`);
  }
});

check("explicit store values win over the preset, legacy pins included", () => {
  const r = resolveTheme({
    preset: "dark-room",
    primaryColor: "#123456",
    saleBadgeBg: "#EF4444",
    successColor: "#10B981",
    headingFont: "Erode",
    dark: { primaryColor: "#ABCDEF", errorColor: "#EF4444" },
    styles: { footerStyle: "columns" },
  });
  assert.equal(r.primaryColor, "#123456");
  assert.equal(r.saleBadgeBg, "#EF4444");
  assert.equal(r.successColor, "#10B981");
  assert.equal(r.headingFont, "Erode");
  assert.equal(r.dark?.primaryColor, "#ABCDEF");
  assert.equal(r.dark?.errorColor, "#EF4444");
  assert.equal(r.dark?.backgroundColor, STORE_THEME_PRESETS["dark-room"].theme.dark.backgroundColor);
  assert.equal(r.fontFamily, "Switzer");
  assert.equal(r.styles.footerStyle, "columns");
  assert.equal(r.styles.heroStyle, "film");
});

check("empty strings never mask a preset value", () => {
  const r = resolveTheme({ preset: "shiraz-zari", primaryColor: "", dark: { linkColor: "" } });
  assert.equal(r.primaryColor, "#5B1A2E");
  assert.equal(r.dark?.linkColor, "#E6C887");
});

check("unknown preset and unknown style values fall back to defaults", () => {
  const r = resolveTheme({
    preset: "nope",
    styles: { heroStyle: "spinning" } as unknown as IStoreTheme["styles"],
  });
  assert.deepEqual(r.styles, DEFAULT_STYLES);
  assert.deepEqual(sanitizeStyles({ heroStyle: "framed", x: 1 }), { heroStyle: "framed" });
  assert.deepEqual(resolveTheme(undefined).styles, DEFAULT_STYLES);
});

check("presets cover every editable colour, light and dark", () => {
  for (const id of THEME_PRESET_IDS) {
    const { theme } = STORE_THEME_PRESETS[id];
    for (const token of THEME_TOKENS) {
      assert.ok((theme as Record<string, unknown>)[token.key], `${id} light ${token.key}`);
      assert.ok((theme.dark as Record<string, unknown>)[token.key], `${id} dark ${token.key}`);
    }
  }
});

check("preset fonts are in the font registry", () => {
  for (const id of THEME_PRESET_IDS) {
    const { theme } = STORE_THEME_PRESETS[id];
    assert.ok((STORE_FONTS as readonly string[]).includes(theme.fontFamily!), `${id} body ${theme.fontFamily}`);
    if (theme.headingFont) {
      assert.ok((STORE_HEADING_FONTS as readonly string[]).includes(theme.headingFont), `${id} heading ${theme.headingFont}`);
    }
  }
});

check("preset style defaults are valid options", () => {
  for (const id of THEME_PRESET_IDS) {
    const { styles } = STORE_THEME_PRESETS[id];
    for (const [key, options] of Object.entries(STYLE_SWITCHES)) {
      assert.ok((options as readonly string[]).includes(styles[key as keyof typeof styles]), `${id}.${key}`);
    }
  }
});

check("every preset and style option has an en and bn label", () => {
  for (const locale of ["en", "bn"]) {
    const messages = JSON.parse(
      readFileSync(path.join(__dirname, "..", "messages", `${locale}.json`), "utf8")
    );
    for (const id of THEME_PRESET_IDS) {
      assert.ok(messages.themePresets?.presets?.[id]?.name, `${locale} ${id}.name`);
      assert.ok(messages.themePresets?.presets?.[id]?.description, `${locale} ${id}.description`);
    }
    for (const [key, options] of Object.entries(STYLE_SWITCHES)) {
      assert.ok(messages.themePresets?.switches?.[key]?.label, `${locale} ${key}.label`);
      for (const o of options) assert.ok(messages.themePresets?.switches?.[key]?.options?.[o], `${locale} ${key}.${o}`);
    }
  }
});

console.log(`\n${passed} checks passed`);

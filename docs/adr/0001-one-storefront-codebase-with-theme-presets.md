---
status: accepted
date: 2026-10-23
---

# One storefront codebase with Theme Presets and Style Switches, built on the ui-ux-pro-max variant

We built four competing storefront redesigns in parallel worktrees (`hero-video/{frontend-design,taste-skill,impeccable,ui-ux-pro-max}`), each by a different design skill, and want all four looks available on main. They diverge in component code (hero, category section, footer, newsletter, product card, skeletons), not only in colours, so they cannot be merged together. We decided to keep **one** storefront codebase (the `ui-ux-pro-max` variant) and reproduce the other three as **Theme Presets** plus a small set of **Style Switches**, selectable per store from the admin. We expect roughly 85–90% visual fidelity to each original variant, not 100%.

`ui-ux-pro-max` was chosen as the base because a side-by-side code review (4 reviewers + 1 synthesis, read-only) found it was the only variant where:

- new theme fields (`headingFont`, `backgroundPattern`, hero banner `video`) are wired through types, Zod and the admin store form, so an admin save does not silently delete them;
- category counts on the home page agree with the `/products?category=` filter;
- theme tokens are derived for contrast (input border, rating, scrim, focus ring, link darkening), so an arbitrary preset palette stays AA-readable without a hand-made dark palette.

Its scores tied with `impeccable` (27/35); the decision was made on merge-blocking bugs, not on score.

## Considered Options

- **A: one base + presets (palette, fonts, radius only)**: cheapest, but only ~60–70% fidelity; every store would share one layout.
- **A+: one base + presets + Style Switches** (chosen): `heroStyle`, `categoryStyle`, `footerStyle`, `newsletterStyle`, `productCardStyle`, each a small closed set of options lifted from the other variants.
- **B: per-store design switch with four full component sets**: 100% fidelity, but every bug fix and feature lands four times; rejected for maintenance cost.
- **C: keep the four branches and merge only one**: no cost, but the other looks are not usable by any store; kept only as the source for cherry-picks.

## Consequences

- The four variant branches are archived, not deleted: they are the reference for building and checking presets.
- **Decided (admin preset pick):** choosing a Theme Preset in the store form sets `theme.preset` and clears the colour, font, radius, background and Style Switch overrides (pinned success/error colours stay). The fields then show the preset's values, and editing one makes it an override. This way a store follows later preset fixes, and the form still shows what will render. Choosing "None" writes the current look back as explicit values.
- None of the variants contains the Style Switch layer; it is new code (preset registry in `src/features/stores/`, switches stored in the store's theme `jsonb`, emitted as `data-*` attributes on `<html>`).
- Theme tokens must be scoped to the storefront (taste-skill's `--ui-*` approach) before merge: the base currently leaks tenant colours and the heading font into admin primitives, which violates the "admin is brand-neutral" rule in CLAUDE.md.
- Global default colours changed (success, error, sale badge, on-primary). Existing stores either accept them or get their old values pinned in their theme data.
- **Decided (F): new default colours apply to new stores only.** `scripts/pin-legacy-theme-defaults.ts` writes the pre-redesign success, error and sale-badge colours into each existing store's theme (light and `dark`) where the store does not set them itself. Everything else (on-primary, muted text, card/surface, link, price) takes the new contrast-safe values on every store: pinning those brought back white cards in dark mode and unreadable button text. `--remove-dropped-pins` removes what the first, wider version pinned on `ecommerce_uux`, only where the value is exactly what that version wrote. It is idempotent, supports `--dry-run`, and refuses any database other than `ecommerce_uux` unless `--allow-db=<name>` is passed. **It must be run against the production DB at merge time** (dry run first), before the new defaults go live.
- **Decided (B): one theme-toggle convention everywhere, admin included:** the icon shows the current mode (sun = light, moon = dark, monitor = system). Storefront header and both admin navs use the shared `ThemeToggle`.
- Other must-fixes before merge: no DB queries in `loading.tsx` (or share them via `cache()`), validate and clean up hero `video` URLs, keep `public/demo/` videos and one-off theme scripts out of the commit.
- One-off theme scripts means the per-variant design scripts used to build and compare the four looks; they stay out. `scripts/pin-legacy-theme-defaults.ts` is different and is committed on purpose: it is the merge-time data migration for decision F, run once against production (`--dry-run` first, then `--allow-db=<prod db>`).
- Hero videos live in media storage (uploaded under `<storeId>/banners/` and served from `/api/media/...` or the S3 public URL), never in `public/demo/`. The hero `video` validation only accepts those URLs or an external http(s) URL; the demo store's montage and poster were moved to media storage on `ecommerce_uux`.

- **Decided (currency): every store sells and charges in taka.** There is no dollar pricing: the store currency only accepts `BDT`, delivery charges and product JSON-LD use it, and the Shirts and Shoes demo stores were moved from USD to BDT (prices × 120, rounded to the nearest 10). This replaces the earlier must-fix to use a per-store currency.
- **Decided (Motion): auto-scroll is a per-store switch, separate from presets.** Shop by Category scrolls right to left from 7 categories and New Arrivals left to right from 6 products, each with its own pause button and pausing on hover, touch, focus or when off screen; reduced motion turns it off. `theme.motion = { categories, newArrivals }` (both on by default) is set in the admin Theme tab under Motion. Choosing a Theme Preset never changes it.

## Open decisions

- Whether a parent category counts and filters its subcategories' products.
- Whether hero CTA text becomes a localized field.

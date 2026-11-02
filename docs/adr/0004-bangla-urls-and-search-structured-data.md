---
status: accepted
date: 2026-11-02
---

# Bangla gets its own `/bn` URLs; the URL, not a cookie, decides the storefront language

The storefront used to pick English or Bangla from a `NEXT_LOCALE` cookie, so
both languages lived on the same URL. Googlebot sends no cookies, so it only
ever saw English, and no Bangla page could rank for queries like "পাঞ্জাবি".
We decided that every storefront page has one URL per language: English stays
unprefixed (`/products/x`) and Bangla lives under `/bn` (`/bn/products/x`),
using next-intl `localePrefix: "as-needed"`. The pages link to each other with
hreflang. Research and sources: `docs/seo-research/bd-punjabi-seo.md`.

## Rules that follow from this

- **The URL is the only source of the storefront language.** `localeDetection`
  and `localeCookie` are off. The language switcher navigates to the other URL;
  it never sets a cookie and never auto-redirects (Google advises against both).
  Admin is outside `[locale]` and keeps its own cookie-based language.
- **English is the unprefixed default for every Store**, even a Bangla-first one.
  next-intl has one static `defaultLocale`, and the navigation helpers depend on
  it. A Store that does not offer Bangla returns 404 under `/bn`.
- **We emit hreflang ourselves** (page metadata + sitemap), with
  `alternateLinks: false` in next-intl. A `bn` alternate is listed only when the
  Store offers Bangla, and for a product only when it has real Bangla content.
  Translated buttons around English text is what Google calls a poor experience.
- **Product and store structured data describe a Bangladeshi merchant**:
  `OnlineStore`, BD address, BDT, one Bangladesh-wide shipping rate (Google only
  accepts shipping regions for the US, Australia and Japan, so inside/outside
  Dhaka cannot be expressed), and the Store's return policy.

## Considered options

- **Prefix both languages (`/en`, `/bn`):** symmetric, but every existing
  English URL and backlink would move and need a 301. Rejected as a site move
  with no ranking benefit.
- **Keep the cookie and add `?lang=bn`:** Google calls URL parameters for
  language "not recommended". Rejected.
- **Per-Store default language (Bangla unprefixed on Bangla-first Stores):**
  possible in the proxy, but next-intl's `createNavigation` uses one static
  config, so links and routing would disagree. Deferred, not rejected.

## Consequences

- A returning visitor with an old `NEXT_LOCALE=bn` cookie now sees English at
  `/…` until they pick Bangla.
- Storefront code must use the locale-aware `Link` / `useRouter` /
  `redirect` from `src/i18n/navigation.ts`, not `next/link` /
  `next/navigation`, or links drop the `/bn` prefix.

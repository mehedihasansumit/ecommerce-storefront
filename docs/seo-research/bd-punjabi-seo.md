# Ranking a Bangladeshi punjabi store on Google: research and plan

*Researched 2 Nov 2026. Sources: Google Search Central, Merchant Center Help, Business Profile Help, web.dev, Next.js 16.2.2 docs bundled in `node_modules/next/dist/docs`, and next-intl 4.13.0 source in `node_modules/next-intl`. Anything not from a primary source is marked **secondary / unverified**.*

**How to read this.** Every claim has its source after it in brackets. Flags used:
- ⚠ **uncertain**: the sources disagree or I could not confirm it.
- 🌏 **region**: depends on the country.
- 🕒 **recent**: the rule changed lately.

> **A correction to the brief.** `src/proxy.ts` does **not** set `x-store-id`. Its matcher is `["/admin/:path*"]`, and all it does is the admin cookie guard plus setting the `APP_SURFACE_HEADER`. Tenant resolution actually happens in `getTenant()` (`src/shared/lib/tenant.ts`), which reads the `Host` header directly and caches the DB lookup. This makes the i18n change easier: the proxy only has to add locale routing, not tenant work. (Source: `src/proxy.ts`, `src/shared/lib/tenant.ts`.)

---

## TL;DR: recommended plan (ranked by impact ÷ effort)

### Code changes (in this repo)

| # | Change | Impact | Effort | Why |
|---|---|---|---|---|
| 1 | **Fill in Product JSON-LD**: `brand`, `itemCondition`, `shippingDetails` (BD, inside/outside-Dhaka rate), `hasMerchantReturnPolicy` (from `store.refundPolicy`), `priceValidUntil` only when there's a sale end date, use `product.currency` | High | S (one file: `src/shared/lib/seo.ts`) | Makes product pages eligible for merchant-listing extras (shipping and returns shown in results). Required fields already exist. |
| 2 | **Organization → `OnlineStore`** with `address` (`addressCountry: "BD"`), `telephone`, `hasMerchantReturnPolicy` | Med | S (`seo.ts`) | Google recommends the most specific subtype and store-wide return policy markup. |
| 3 | **Give Bangla its own URLs: `/bn/...`, English stays unprefixed** (next-intl `localePrefix: 'as-needed'`, `localeDetection: false`) | **Very high** for Bangla queries | L (about 45–60 files, mostly mechanical) | Today Googlebot can only ever see English, so **no Bangla page can rank at all**. |
| 4 | **hreflang** (`en`, `bn`, `x-default`) in page metadata and in `sitemap.ts`, only for stores that offer `bn` **and** products that really have Bangla text | High (comes with #3) | S, once #3 is done | Google's documented way to link language versions. |
| 5 | **ProductGroup / `hasVariant`** for size and colour variants (the PDP already preselects variants from `?<Option>=<value>`) | Med | M | Lets variant info appear in merchant listings. |
| 6 | **Redirect (301) every non-primary store domain to `domains[0]`** | Med | S | Stops duplicate copies of the store across its own domains. A redirect is a stronger signal than canonical alone. |
| 7 | **Turn hidden image wins into real ones**: real `alt` text per image (Bangla on `/bn`), descriptive file names, image entries in the sitemap | Med | S–M | Google Images is a real channel for clothing. |
| 8 | **Check Core Web Vitals on real phones** (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1), especially the hero and Google Fonts | Med | M | Most BD shoppers are on mobile. Google ranks the mobile version. |

### Off-site / business tasks

| # | Task | Impact | Effort |
|---|---|---|---|
| A | **Search Console Domain property per store domain** (DNS verify), submit `/sitemap.xml`, inspect key URLs | High | S |
| B | **Google Business Profile**, but **only if you have a showroom or shop customers can visit** (or you deliver in person as a service-area business). Online-only is not eligible. | High for "near me" | S–M |
| C | **Unique product copy and photos** per store. Write Bangla descriptions for real, not just translated buttons. Add fabric, fit and size notes. | High | Ongoing |
| D | **Eid content calendar**: a permanent `/categories/eid-punjabi` style page, refreshed about 6–8 weeks before each Eid | High (seasonal) | M |
| E | **Merchant Center**: try adding Bangladesh as a target country in your own account. Google's help pages **do not list Bangladesh** for free listings (⚠, see Q3). If it's refused, rely on organic results plus structured data. | Unknown | S to test |
| F | **Reviews and links**: ask buyers for Google reviews (GBP) and on-site reviews, and get listed and linked from BD fashion and lifestyle sites | Med–High | Ongoing |

---

## Q1. Bilingual URLs and hreflang

### What Google says
- Google "recommends using different URLs for each language version of a page", **rather than** "using cookies or browser settings to adjust the content language". Googlebot "sends HTTP requests without setting `Accept-Language`", so it may never see your other versions. [developers.google.com/search/docs/specialty/international/managing-multi-regional-sites]
- **Don't auto-redirect** users between language versions based on their language. It can stop users and Google from seeing all versions. [same page]
- Google works out the language from the visible content. It does **not** use the `lang` attribute or the URL for this. [same page]
- **Translating only the boilerplate** (buttons, menus) while the main content stays in one language is called out as a poor experience. [same page]
- Sub-directories on one domain (`example.com/bn/`) are listed as "easy to set up, low maintenance". URL parameters (`?lang=bn`) are "not recommended". [same page]
- **hreflang** can go in the HTML `<head>`, an HTTP `Link` header, or the XML sitemap. All three are equivalent. Each version "must list itself as well as all other language versions". Without return links the tags are ignored. URLs must be fully qualified (`https://…`). `x-default` is the fallback for "no other language matches". Codes are ISO 639-1 (language) plus optional ISO 3166-1 (region). [developers.google.com/search/docs/specialty/international/localized-versions]
- `bn` (Bengali) and `bn-BD` are both valid keys in Next's metadata type. [`node_modules/next/dist/lib/metadata/types/alternative-urls-types.d.ts`]
- When picking a canonical, Google prefers URLs that are part of an hreflang cluster, and the canonical should be in the same language. [developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls]
- 🕒 The Search Console **International Targeting report is deprecated**. Google "will still support and use hreflang tags". Country targeting in Search Console is "no longer supported". [support.google.com/webmasters/answer/12474899]

**What this means here.** The current cookie setup (`NEXT_LOCALE` read in `src/i18n/request.ts`, written by `LanguageSwitcher.tsx` and `/api/locale`) is exactly the pattern Google advises against. Googlebot has no cookie, so it always gets English. Bangla product names and descriptions stored in the DB are invisible to Search.

### Which URL scheme
**Recommended: `localePrefix: 'as-needed'`, with English unprefixed and Bangla under `/bn`.**

| | `as-needed` (en at `/`, bn at `/bn`) | `always` (`/en`, `/bn`) |
|---|---|---|
| Existing English URLs and backlinks | **Unchanged.** No redirects needed. | Every URL moves, so you need site-wide 301s. |
| Bangla URLs | New (`/bn/products/x`) | New |
| Risk | Low | Higher (a site move) |

Example:
```
https://shirts.example.com/products/white-cotton-punjabi      ← English (as today)
https://shirts.example.com/bn/products/white-cotton-punjabi   ← Bangla (new)
```
next-intl automatically redirects a superfluous `/en/about` to `/about`. [next-intl.dev/docs/routing/configuration]

⚠ **Open design choice: per-store default language.** `IStore` has `defaultLanguage` and `supportedLanguages` (`src/features/stores/types.ts`), but next-intl's `defaultLocale` is one global value. Simplest path: keep `en` as the unprefixed default for every store. A Bangla-first store would then have its main language under `/bn`. That works fine for SEO, but it's a product decision. A per-request `createMiddleware({...defaultLocale: store.defaultLanguage})` is possible ("create the middleware based on dynamic configuration", [next-intl.dev/docs/routing/middleware]). However, next-intl's `createNavigation` helpers use one static routing config, so the two would disagree. I don't recommend it for v1.

### How to compose next-intl with the existing proxy (verified in source)
Facts from the installed code:
- Next 16 renamed `middleware.ts` → `proxy.ts`. Proxy runs on the **Node.js runtime by default**, so a DB or cache lookup is allowed. [`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (lines ~219, 378–403)]; [next-intl.dev/docs/routing/middleware]
- next-intl's handler copies `request.headers`, sets `X-NEXT-INTL-LOCALE`, then either **rewrites** `/products/x` → `/en/products/x` internally, or redirects. [`node_modules/next-intl/dist/esm/development/middleware/middleware.js`, the `next()` and `redirect()` functions]
  - Because of that internal rewrite, **the app must have a `[locale]` segment**.
- Server-side `getLocale()` / `requestLocale` read the `X-NEXT-INTL-LOCALE` request header (or `setRequestLocale`). [`node_modules/next-intl/dist/esm/development/server/react-server/RequestLocale.js`]
- With `localeDetection: false`, the locale comes **only** from the URL prefix, otherwise `defaultLocale`. Cookie and `Accept-Language` are skipped. [`.../middleware/resolveLocale.js` lines 42–65]
- Even with detection off, `syncCookie` still **writes** a `NEXT_LOCALE` cookie on some responses unless `localeCookie: false`. [`.../middleware/syncCookie.js`]
- `alternateLinks` (default `true`) adds an HTTP `Link` header with hreflang for **every** matched path, using `x-forwarded-host`/`host`. [`.../middleware/getAlternateLinksHeaderValue.js`]
  - The docs say to turn it off when "you have pages that are only available for certain locales". [next-intl.dev/docs/routing/configuration]
  - That's our case: some stores are English-only, and some products have no Bangla text.

Sketch (illustration only, not applied):
```ts
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["en", "bn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: false,   // URL is the only source of truth
  localeCookie: false,      // no Set-Cookie on every page (keeps CDN-cacheable)
  alternateLinks: false,    // we emit hreflang ourselves, per store/product
});

// src/proxy.ts
import createMiddleware from "next-intl/middleware";
const handleI18n = createMiddleware(routing);

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return adminGuard(request);            // existing logic, unchanged
  }
  return handleI18n(request);              // storefront: locale routing
}
export const config = {
  matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```
The matcher pattern comes from [next-intl.dev/docs/routing/middleware]. It skips `/api`, `/_next` and files with a dot, so `sitemap.xml`, `robots.txt`, `sw.js` and `manifest.webmanifest` stay outside `[locale]`.

If you later need extra request headers (for example a tenant id), set them **before** calling the handler, because next-intl copies `request.headers`. For example, build `new NextRequest(request, { headers })` first. Or change the response after it, as the docs show: `let response = handleI18nRouting(request); response.headers.set(...)`. [next-intl.dev/docs/routing/middleware]

**Stores that don't offer Bangla:** in `src/app/[locale]/(storefront)/layout.tsx`, call `notFound()` when `locale` is not in `tenant.supportedLanguages`. That keeps `/bn/...` from existing on English-only stores.

### app/ restructure
```
src/app/
  layout.tsx          ← keep as root (getLocale() still works via the header); admin keeps using it
  (admin)/…           ← unchanged, outside [locale]
  api/…  sitemap.ts  robots.ts  manifest.ts  offline/   ← unchanged, outside [locale]
  [locale]/
    (storefront)/…    ← move the whole (storefront) group here
```
- `src/i18n/request.ts`: use `await requestLocale` first. Fall back to the `NEXT_LOCALE` cookie only for admin routes, which don't pass through i18n routing.
- Add `src/i18n/navigation.ts` with `createNavigation(routing)`. Then swap `next/link` and `next/navigation` for the locale-aware `Link`, `useRouter`, `usePathname` and `redirect` in storefront code. [next-intl.dev/docs/routing/configuration]

### Emitting hreflang
**In page metadata.** Next renders `alternates.languages` as `<link rel="alternate" hreflang=…>`. [`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` ~L395–418]

Extend `createStoreMetadata(store, { path }, locale)`:
```ts
const en = `${baseUrl}${path}`, bn = `${baseUrl}/bn${path === "/" ? "" : path}`;
alternates: {
  canonical: locale === "bn" ? bn : en,                    // self-canonical per language
  languages: offersBn && hasBnContent
    ? { en, bn, "x-default": en } : undefined,
}
```
Also set `openGraph.locale` to `bn_BD` or `en_US`.

**In the sitemap.** `MetadataRoute.Sitemap` entries accept `alternates: { languages: {...} }`. [`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` ~L211–330]

Add a `bn` URL entry (with the same alternates) for every page that has Bangla content. Doing both HTML and sitemap is fine; they're equivalent signals. [localized-versions page]

**Thin-translation guard.** If `product.name.bn` or `product.description.bn` is empty, the `/bn` product page is English content inside Bangla boilerplate, which Google warns about. For those products, leave `bn` out of hreflang and the sitemap, and put `robots: noindex` on the `/bn` URL (or canonical it to the English URL).

### Language switcher: keep the cookie?
**No, not for routing.** The switcher should **navigate to the other URL**, e.g. `router.replace(pathname, { locale: "bn" })` from `createNavigation`. That URL *is* the user's choice. This also removes the full `window.location.reload()` workaround in `LanguageSwitcher.tsx`.

Optional: keep a cookie only to show a one-time "বাংলায় দেখুন?" banner on `/`. **Never auto-redirect** (Google advice above).

### Effects on existing URLs and backlinks
- English URLs: **unchanged**, so no redirects needed.
- Bangla had no URLs before, so there is nothing to redirect.
- Behaviour change: returning visitors with a `NEXT_LOCALE=bn` cookie will now see English at `/…` until they click Bangla (or the banner).
- Watch hard-coded storefront paths in API routes, emails and payment callbacks (for example SSLCommerz success/fail URLs). They still work because English is unprefixed, but Bangla users would land on English pages.

### Estimated files that change (about 45–60)
- **Config and routing:**
  - `src/proxy.ts`
  - `src/i18n/routing.ts`
  - `src/i18n/request.ts`
  - new `src/i18n/navigation.ts`
- **Move:** everything under `src/app/(storefront)/**` → `src/app/[locale]/(storefront)/**`. That's 27 files, moves only, plus `params.locale` / `setRequestLocale` where needed.
- **SEO:**
  - `src/shared/lib/seo.ts`
  - `src/app/sitemap.ts`
  - `src/app/layout.tsx` (lang / fonts already use `getLocale()`, so a small change)
- **Language switching:**
  - `src/shared/components/storefront/LanguageSwitcher.tsx`
  - `src/app/api/locale/route.ts` (keep for admin, or delete)
- **Swap `next/link` / `next/navigation` for the locale-aware helpers** (about 38 storefront files found with grep):
  - `src/shared/components/storefront/{Header,Footer,HeroBanner,MobileBottomNav,WordmarkFooter,FloatingCallButton}.tsx`
  - `src/shared/components/ui/Button.tsx`
  - `src/features/products/components/{ProductCard,SealProductCard,EditorialProductCard,ProductRail,ActiveFilters,SortDropdown}.tsx`
  - `src/features/products/hooks/useProductSelection.ts`
  - `src/features/categories/components/{CardShowcase,CategoryShowcase,PlateShowcase,ScrollRowShowcase}.tsx`
  - `src/features/cart/components/CartItemRow.tsx`
  - `src/features/notifications/components/{AnnouncementBanner,NotificationBell}.tsx`
  - `src/features/reviews/components/ReviewSection.tsx`
  - the storefront `page.tsx` files
- **Check:** `public/sw.js` (cached routes), any server `redirect("/…")` in storefront pages.

---

## Q2. Structured data (Product, Offer, Organization)

### Google's current list for **merchant listings** (pages where the shopper can buy) [developers.google.com/search/docs/appearance/structured-data/merchant-listing]

| Type | Required | Recommended |
|---|---|---|
| `Product` | `name`, `image`, `offers` | `aggregateRating`, `review`, `brand.name` (one brand), `description`, `sku`, `mpn`, GTINs, `color`, `size`, `material`, `pattern`, `audience`, `category`, `isVariantOf` / `inProductGroupWithID`, `hasCertification` |
| `Offer` (must be `Offer`, not `AggregateOffer`) | `price` (> 0), `priceCurrency` | `availability`, `itemCondition`, `url`, `priceValidUntil`, `validFrom`/`validThrough`, `shippingDetails`, `hasMerchantReturnPolicy` |
| `OfferShippingDetails` | `shippingDestination.addressCountry`, `shippingRate` (`currency` + `value` or `maxValue`), `deliveryTime` (`handlingTime` and `transitTime` with `minValue`/`maxValue`/`unitCode: "DAY"`) | — |
| `MerchantReturnPolicy` | `applicableCountry`, `returnPolicyCategory` | `merchantReturnDays` (needed for a finite window), `returnFees`, `returnMethod`, `returnShippingFeesAmount` |

More rules from the same page:
- `shippingRate.currency` must match the offer currency.
- 🌏 `addressRegion` is supported **only for the US, Australia and Japan**, so "inside Dhaka vs outside Dhaka" **cannot** be expressed as regions. Use one BD-wide rate. A reasonable choice is the outside-Dhaka (higher) charge, or `maxValue`.
- Precedence, strongest first: Merchant Center product feed → Content API → Merchant Center or Search Console settings → product-level markup → organization-level markup.
- **Product snippets** are for pages without a buy option. Meeting the merchant-listing requirements can also make a page eligible for snippets. [developers.google.com/search/docs/appearance/structured-data/product]
- Put Product markup in the **initial HTML**. JS-generated markup makes Shopping crawls "less frequent and less reliable". This repo already server-renders it. [product-variants page]

### Variants (sizes and colours) [developers.google.com/search/docs/appearance/structured-data/product-variants]
- `ProductGroup` needs `name`. Recommended: `productGroupID` (parent SKU), `variesBy` (full URLs, e.g. `https://schema.org/size`, `https://schema.org/color`), `hasVariant`.
- Each variant is a full `Product` with a unique `sku`.
- **Single-page setup** (this repo): the group `url` is the canonical product URL. Each variant must also be reachable with a distinct preselect URL that shows the right price, image and stock. **This already exists**: `useProductSelection.ts` reads `searchParams.get(optionName)`.

Example:
```json
{ "@type": "ProductGroup", "name": "White Cotton Punjabi", "productGroupID": "PJ-101",
  "variesBy": ["https://schema.org/size"], "url": "https://shop.example/products/white-cotton-punjabi",
  "hasVariant": [{ "@type": "Product", "sku": "PJ-101-M", "size": "M",
     "offers": { "@type": "Offer", "price": 2450, "priceCurrency": "BDT",
       "url": "https://shop.example/products/white-cotton-punjabi?Size=M",
       "availability": "https://schema.org/InStock" } }] }
```

### Organization vs OnlineStore [developers.google.com/search/docs/appearance/structured-data/organization]
- "Use the most specific subtype": for e-commerce, `OnlineStore`.
  - If there's a physical shop, use the most specific `LocalBusiness` subtype (e.g. `ClothingStore`) instead.
- No properties are required. Recommended: `name`, `url`, `logo`, `sameAs`, `address` (`PostalAddress` with `addressCountry`), `contactPoint`, `email`, `telephone`, `legalName`, `vatID`/`taxID`, and 🕒 **`hasMerchantReturnPolicy`, `hasShippingService`, `hasMemberProgram`** at organization level.
- Put it on the home page or the about page.
- Org-level policy is the fallback. Product-level policy wins when both exist. [merchant-listing page]

### Is BDT / Bangladesh supported?
- The structured-data docs state **no currency or country restriction** for `priceCurrency` / `applicableCountry` (ISO codes, so `BDT` and `BD` are valid). The only country limits are on `addressRegion`, `postalCode` and custom `DefinedRegion`. [merchant-listing page]
- ⚠ The docs **don't publish a country availability list** for merchant-listing rich results, and Google says features "may change over time". [product page] I **could not confirm** that shipping and return annotations actually show to searchers in Bangladesh. The markup is cheap and valid, but don't promise the visual extras.

### Recommendation for this repo
`src/shared/lib/seo.ts`:
1. `buildProductJsonLd`:
   - Add `brand: { "@type": "Brand", name: store.name }`.
   - Add `itemCondition: "https://schema.org/NewCondition"`.
   - Set `priceCurrency: product.currency || DEFAULT_CURRENCY`.
   - Add `shippingDetails` from `store.deliveryConfig` (`addressCountry: "BD"`, `currency: "BDT"`).
   - Add `hasMerchantReturnPolicy` from `store.refundPolicy`:
     - `enabled` → `MerchantReturnFiniteReturnWindow` with `merchantReturnDays: windowDays`
     - else → `MerchantReturnNotPermitted`
     - set `applicableCountry: "BD"`
   - Add `priceValidUntil` only when a sale has an end date (don't invent one).
   - When `product.variants.length > 0`, emit a `ProductGroup` with `hasVariant`, using `variesBy` from `product.options`.
   - Add `color` / `material` from `product.details` where they exist.
   - It needs `store`, so pass the tenant in (product page: `src/app/(storefront)/products/[slug]/page.tsx`).
2. `buildOrganizationJsonLd`:
   - Set `"@type": "OnlineStore"` (or `ClothingStore` if there's a walk-in shop).
   - Add `address` (`PostalAddress`, `addressCountry: "BD"`; `store.contact.address` is a free-text string, so put it in `streetAddress`).
   - Add top-level `telephone`, `hasMerchantReturnPolicy`, and `sameAs`, including the Facebook page (often BD's main brand presence).
3. The breadcrumb on the PDP currently skips the category. Add `Home > Category > Product` (CLAUDE.md SEO rule #5).
4. Validate with the Rich Results Test, then watch the Search Console "Merchant listings" and "Product snippets" reports.

---

## Q3. Google Merchant Center / free listings / Shopping ads

### Findings
- 🌏⚠ **Free listings country list.** Google's "Show your products for free on Google" page lists supported countries. **Bangladesh is not on it**. Nearby markets that are: India, Indonesia, Malaysia, Vietnam, Thailand, Philippines. [support.google.com/merchants/answer/13692890]
- 🌏⚠ **Shopping ads plus free listings country/currency table.** On my fetch, it **did not include Bangladesh or BDT**, and **Bengali is not in the supported content-language list**. [support.google.com/merchants/answer/160637]
  - Conflict: one search-engine snippet of the same page showed "Bangladesh ** BDT". It may be an older or newer version, or a tool parsing error. **Unverified. Check it yourself in Merchant Center.**
- Multi-country targeting from one offer covers "any other country in which Shopping ads and listings are available". The article doesn't define that set. With currency conversion, "consumers can assume that you're not a local advertiser". [support.google.com/merchants/answer/15404838]
- Merchant listings via **structured data alone** (no Merchant Center account) are possible for organic results. [developers.google.com/search/blog/2022/09/merchant-listings]
- **Secondary / unverified:** third-party lists (Bidnamic, FeedArmy) include Bangladesh as a Shopping country, some "in beta". Not reliable.

### Recommendation
1. **Test it directly (15 minutes):** create a Merchant Center account and try adding Bangladesh as a target country with BDT. The UI is the real answer.
2. **If Bangladesh is refused**, which the current help pages suggest:
   - Skip Merchant Center for now.
   - Organic ranking plus Product structured data (Q2) plus Google Images is the main Google channel.
   - Paid alternatives are **Search ads** (text ads on "punjabi price in bd") and Performance Max without a feed. ⚠ Google Ads availability in BD was not verified in this research.
   - Keep Facebook/Instagram Shops and WhatsApp/Messenger ordering, already built.
3. **If Bangladesh is accepted:** the feed must be in a supported language, which probably means **English** titles and descriptions. Bengali isn't in the list. Map from the same product data. Also set shipping and returns in Merchant Center, since they outrank markup.

---

## Q4. Local SEO (Google Business Profile)

### Findings [support.google.com/business/answer/3038177, "Guidelines for representing your business on Google"]
- **Eligible:** a business with "a physical location that customers can visit, or travels to customers where they are".
  - An **online-only** store is therefore **not** eligible (implied, not stated word for word).
  - "Rents a mailing address but doesn't operate there", virtual offices and P.O. boxes are **not** eligible.
  - Co-working spaces only qualify if staffed and receiving customers during hours.
- **Service-area business** (you go to customers): hide the address, set service areas. One profile per service business.
  - A storefront that also delivers: show the address **and** set a service area.
  - ⚠ Store delivery by a courier (Pathao/RedX/Steadfast) is probably **not** "travels to customers" in GBP's sense. My reading, unverified.
- **Name rules:** "should reflect your business's real-world name". "Including unnecessary information in your business name isn't permitted". So don't name the profile "XYZ – Best Punjabi Shop Dhaka".
- **Local ranking** "is mainly based on relevance, distance, and prominence". Prominence includes "how many websites link to your business and how many reviews you have". "There's no way to request or pay for a better local ranking." [support.google.com/business/answer/7091]

### Recommendation
- **If any store has a showroom** (e.g. in a Dhaka market):
  - Create and verify a GBP with primary category "Clothing store" / "Men's clothing store" (pick from GBP's list), hours (including Eid/Chaand Raat hours), many real photos, and the website link to the store domain.
  - Add `ClothingStore` (LocalBusiness) JSON-LD with the same NAP on the home or contact page (Q2).
  - Ask every buyer for a Google review.
- **If online-only:** no GBP. "Near me" queries are then out of reach. Compete on "punjabi price in bd" / "অনলাইনে পাঞ্জাবি" type queries instead.
- "punjabi dokan" style queries: GBP plus Banglish and Bangla wording on the page (Q5). Google matches visible text, not hidden keywords.

---

## Q5. Keywords and content strategy

### Findings (primary)
- Ask whether the content is "primarily made to attract visits from search engines" or provides "original information … analysis"; whether it's "mass-produced"; whether it uses "extensive automation". "Trust is most important" in E-E-A-T. [developers.google.com/search/docs/fundamentals/creating-helpful-content]
- Google's product-review guidance mainly covers **editorial** reviews ("an expert staff member or a merchant who guides people between competing products"). It asks for first-hand evidence, measurements, pros and cons. It's relevant to buying guides, not to customer review widgets. [developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews]
- Translating only boilerplate counts as poor quality (Q1).

### Findings (**secondary / unverified**: I could not reach Google Trends, which returned HTTP 429)
- People search in three scripts:
  - Bangla: "পাঞ্জাবি", "পাঞ্জাবির দাম"
  - English: "punjabi price in bd", "eid punjabi", "cotton punjabi"
  - Banglish, including the spelling **"panjabi"** (very common in BD)
- Strong peaks before **Eid-ul-Fitr** and smaller ones before **Eid-ul-Adha**, Pohela Boishakh (14 April) and weddings.
- Approximate 2027 dates (moon-sighting dependent): Eid-ul-Fitr ≈ 9–10 Mar 2027, Eid-ul-Adha ≈ 16–17 May 2027.
- **Verify:** trends.google.com with geo = Bangladesh, comparing `punjabi`, `panjabi`, `পাঞ্জাবি` over 5 years. Then use your own Search Console Performance → Queries after launch. That's real data for your site.

### Recommendation
- **One page per search intent, not per keyword.** Use category landing pages (`/categories/[slug]`) with a short **unique** intro in both languages:
  - fabric (cotton, silk, linen, katan)
  - occasion (Eid, wedding, office)
  - style (kabli, panjabi-pajama set, kids)
- **Permanent seasonal URL.** Keep e.g. `/categories/eid-collection` all year and refresh its products and copy 6–8 weeks before each Eid, so the URL keeps its ranking history. (Reasoning, not a Google rule.)
- **Product pages:**
  - Titles like "White Cotton Punjabi – Regular Fit | Store". Bangla title on `/bn`.
  - Fabric, GSM, fit, care notes and **size chart** (already built) as visible text.
  - Real photos (on a model, close-up of fabric and embroidery).
  - Put "panjabi" naturally in copy (e.g. "panjabi / punjabi") once. **Don't stuff**.
- **Supplier descriptions:** rewrite them. Copied text is "summarizing what others have to say without adding much value". Add your own measurements and photos.
- **Buying guides** (optional, high-trust): "How to choose a punjabi size", "Cotton vs linen for Eid". Follow the product-review guidance (first-hand photos, measurements).
- **Price in text:** show `৳` price as text via `<Price>`. It's already in structured data.

---

## Q6. Multi-tenant risk (duplicate content)

### Findings [developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls]
- Canonical signals, strongest first: **redirects** ("strong"), **`rel=canonical`** ("strong"), sitemap inclusion ("weak"). They stack.
- Without a declared canonical, Google picks one itself.
- Don't use robots.txt for canonicalization.
- The page does not describe a "duplicate content penalty". Duplicates are **filtered** (one shown), not punished. Cross-domain canonical is not covered on this page. ⚠ It's widely used, but I didn't re-verify it here.

### What this repo does today
- `createStoreMetadata` canonicalises to `https://${store.domains[0]}${path}`. That's good: a store reachable on several domains points to one. (`src/shared/lib/seo.ts`)
- Each store's sitemap and robots use `domains[0]`. (`src/app/sitemap.ts`, `src/app/robots.ts`)

### Recommendation
1. **301 non-primary domains** (and `www`/non-`www`) to `domains[0]`. Do it in `src/proxy.ts` (it will match storefront paths after Q1) or at the reverse proxy. A redirect is stronger than canonical.
2. **Different stores selling the same punjabi:** if they are **different brands**, write different descriptions and use different photos. Otherwise Google shows only one of them for a query. **Don't** cross-canonical between competing tenants: that tells Google to drop one store's page.
3. If two tenants are the **same business** (e.g. a test store), `noindex` the copy.
4. Keep `/products?sort=…&filter=…` canonicalised to `/products` (already true via `path: "/products"`).
5. ⚠ Tenant isolation already exists (`storeId` in every query). Also make sure the sitemap only lists the current tenant's products, which `ProductService.getByStore(tenant._id)` does.

---

## Q7. Core Web Vitals, mobile-first and images

### Findings
- **Thresholds ("good")**, measured at the **75th percentile**, split by mobile and desktop [web.dev/articles/vitals]:
  - LCP ≤ **2.5 s**
  - INP ≤ **200 ms**
  - CLS ≤ **0.1**
- 🕒 INP replaced FID as a stable Core Web Vital in 2024. [same]
- Google "highly recommend[s]" good CWV. It "aligns with what our core ranking systems seek to reward". The page gives no weight relative to relevance. [developers.google.com/search/docs/appearance/core-web-vitals]
- 🕒 **Mobile-first indexing is complete.** "The trek to Mobile First Indexing is now complete." Google crawls with the smartphone agent. [developers.google.com/search/blog/2023/10/mobile-first-is-here]
  - A responsive site has the same content on both. [developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing]
- **Images** [developers.google.com/search/docs/appearance/google-images]:
  - Use `<img>`, not CSS backgrounds ("Google doesn't index CSS images").
  - **Alt text** is "the most important attribute". Describe the image and avoid keyword filling.
  - Use short descriptive file names.
  - Give `srcset` a `src` fallback.
  - WebP and AVIF are supported.
  - Image sitemaps help, and CDN hosts on other domains are allowed.
  - Place images near relevant text.

### Recommendation for this repo
- `next.config.ts` has `images.unoptimized: true`. Uploads are pre-resized to 400/800 px WebP with `srcSet` and served from the CDN. That's fine, but:
  - Make sure the PDP hero image and the home hero are **not lazy-loaded** (`priority` / `fetchPriority="high"`), so LCP isn't delayed.
  - Check that the `src` fallback is present.
- **Fonts:** the root layout loads Google Fonts stylesheets (and Noto Sans Bengali when the store offers `bn`). Watch LCP and CLS on 3G/4G phones. Consider `display=swap` (check `fontStylesheetUrls`) and self-hosting via `next/font`.
- **Alt text:** `IProductImage.alt` exists. Make the admin form require it, and use a Bangla alt on `/bn` (it's currently one string, not localized).
- **Image sitemap:** add `images: [url]` per product entry in `src/app/sitemap.ts`. Next supports it. [`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md` ~L137]
- Measure with PageSpeed Insights (field data) and the Search Console CWV report after launch. Lab scores alone are not ranking data.

---

## Q8. Search Console setup

### Findings
- A **Domain property** covers all subdomains and both http/https, and needs **DNS verification**. A URL-prefix property covers one exact prefix. Every domain is a separate property, up to 1,000 per account. [support.google.com/webmasters/answer/34592]
- 🕒 The **International Targeting report is deprecated**. Use hreflang. You **cannot** set "Bangladesh" as a target country in Search Console any more. [support.google.com/webmasters/answer/12474899]

### Recommendation (per store domain)
1. Add a **Domain property** (e.g. `punjabi-store.com`) and verify it with a TXT record at the DNS host.
2. **Sitemaps** → submit `https://<domain>/sitemap.xml`. It's already referenced in `robots.ts`.
3. **URL Inspection** on: home, one category, one product, and (after Q1) the `/bn` versions. Confirm "Page is indexed", the Google-selected canonical, and detected structured data. Use "Request indexing" for new key pages (e.g. the Eid collection).
4. Watch these reports:
   - Pages (indexing)
   - Merchant listings and Product snippets
   - Core Web Vitals
   - Performance → Queries (filter `পাঞ্জাবি` / `panjabi`)
5. Country signals now come from the content (Bangla, BDT, BD address, `.bd` domain if any) and hreflang. There's no setting for it.

---

## Open questions / unverified

1. ⚠🌏 **Merchant Center in Bangladesh.** Google's help pages (fetched 2 Nov 2026) don't list Bangladesh for free listings or Shopping, and don't list Bengali as a feed language. One snippet suggested otherwise. **Test in a real Merchant Center account.**
2. ⚠🌏 **Do merchant-listing extras (shipping, returns, price) show to searchers in BD?** Google publishes no country list. The markup is valid either way.
3. ⚠ **Bangladesh search behaviour** (Bangla vs English vs Banglish share, "panjabi" spelling, Eid peaks) is **secondary / unverified**. Google Trends was rate-limited (HTTP 429). Check Trends and Search Console data.
4. ⚠ **Eid 2027 dates** are approximate and depend on moon sighting.
5. ⚠ **Per-store default language.** Should Bangla-first stores be unprefixed? This needs a product decision. The recommended v1 keeps `en` unprefixed for all stores.
6. ⚠ **GBP for courier-delivery-only stores.** My reading is "not eligible". Confirm with GBP support if a store has no showroom.
7. ⚠ **Cross-domain canonical.** Widely used, but not re-verified in this pass. The recommendation leans on 301 redirects instead.
8. ⚠ **Search Console shipping/returns settings** (mentioned as a precedence source in the merchant-listing docs). Availability for BD sites is not checked.
9. ⚠ **Google Ads (Search/PMax) availability and policies for BD advertisers.** Not researched here.
10. 🕒 **`hasShippingService` / `hasMemberProgram` at Organization level** are newer additions to Google's docs. Re-check before implementing.

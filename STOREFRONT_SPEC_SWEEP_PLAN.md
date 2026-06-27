# Storefront Spec-Compliance Sweep (i18n · currency · primitives · a11y)

## Context
A read-only audit of the storefront **products** components (3 parallel Explore agents) surfaced ~60 findings clustering into 7 themes. The root problem: storefront components drifted from CLAUDE.md rules — hardcoded English strings (break `bn` locale), hardcoded `৳`/`toLocaleString()` instead of the `<Price>` primitive (break non-BDT stores AND show English numerals to `bn` users), hand-rolled buttons/inputs/alerts instead of `@/shared/components/ui`, and missing a11y affordances.

Decisions locked with the user:
- **Breadth:** whole storefront, in **two waves** — Wave 1 fixes the products scope as the reference implementation; Wave 2 sweeps the rest (cart, checkout, account, home, shared/storefront) against that template. **Admin is excluded** (different theming rules per CLAUDE.md).
- **Severity bar:** fix **all** themes (real bugs + spec/design-system compliance).
- **Bengali:** write **real `bn` translations** for every new key (bn.json is fully mirrored — an English placeholder would re-introduce the exact bug).

Ground truth confirmed:
- `<Price>` (`src/shared/components/ui/Price.tsx`) already handles per-store `currency`, `--color-price`, discount strike-through, and **Bengali numerals** (`bn-BD`) when `locale="bn"`. `formatMoney()` inside it is module-private.
- All target components are `"use client"`; `locale` is available via `useLocale()` (next-intl), `currency` via `useTenant()?.currency ?? "BDT"` (`useTenant()` returns `IStore`). **No prop drilling needed.**
- `reviews` i18n namespace **does not exist** in `messages/en.json` — Review* components have zero keys.

---

## Wave 1 — Products scope (reference implementation)

### Step 0 — Shared helper (prereq for string-context currency)
Some currency appears inside strings (button labels, WhatsApp template) where a `<Price>` element can't go.
- Export `formatMoney(amount, currency, locale)` from `src/shared/components/ui/Price.tsx` (or extract to `src/shared/lib/money.ts` and have `Price` import it). Reuse everywhere a currency string is built.

### Theme A — Currency → `<Price>` / `formatMoney`
Replace every `৳{x.toLocaleString()}` with `<Price>` (JSX context) or `formatMoney()` (string context), passing `currency={useTenant()?.currency ?? "BDT"}` and `locale={useLocale()}`:
- `ProductCard.tsx` — price + compareAt → `<Price ... size="md" />` (replaces manual discount markup).
- `ProductDetailClient.tsx` — `displayPrice`, `displayCompareAt`, `previewLineTotal` → `<Price>`.
- `MobileBuyBar.tsx` — price in CTA label → `formatMoney()`.
- `BulkPricingTable.tsx` — per-tier prices + "base" price → `<Price>` / `formatMoney()`.

### Theme B — i18n: add keys (en + bn) and wire `useTranslations`
Add keys to **both** `messages/en.json` and `messages/bn.json`. Use **ICU plurals** for counts.
- **New `reviews` namespace** (`ReviewSection`, `ReviewForm`, `ReviewList`): `customerReviews`, `outOf5`, `writeReview`, `yourRating`, `title`, `review`, `photos`, `submitReview`, `submitting`, `uploadingPhotos`, `thankYouPending`, `logInToReview`, `onlyVerified`, `alreadyReviewed`, `onlyPurchasers`, `noReviewsYet`, `loadMore`, placeholders.
- **`productCard`**: `new`, `featured`, `onlyLeft` (`{count, plural, ...}`). (`outOfStock` already used.)
- **`productDetail`**: `pieces` (`{count, plural, one {# piece} other {# pieces}}`), `addedToCart`, `qty`, gallery `zoomHint`/`reset`/keyboard hints (`noImage` exists), bulk-pricing labels (`bulkPricing`, `perPiece`, `total`, `buy`, `base`).
- **`productSort`** (new) or add to `products`: `newest`, `priceLowHigh`, `priceHighLow`, `topRated` — convert `SortDropdown` `SORT_OPTIONS` to use `useTranslations` (component currently has NO i18n).
- **`products`**: `activeFilters`, `removeFilter` (aria) for `ActiveFilters` (currently hardcoded "Active filters:").
- **`socialOrder`** (new): localized order-message template for `SocialOrderButtons` `DEFAULT_TEMPLATE`.

### Theme C — strip redundant `t("x") || "English"` fallbacks
Keys confirmed present in en.json — remove the dead fallbacks:
- `products/page.tsx`: `showing`, `of`, `productsLabel`.
- `products/[slug]/page.tsx`: `freeShipping`, `easyReturns`, `secureCheckout`, `outOfStock`.

### Theme D — hand-rolled → primitives (`@/shared/components/ui`)
**Swap (genuine violations / carry real defects):**
- `SortDropdown.tsx`: raw `<select>` → `<Select>`.
- `SearchFormWithTracking.tsx`: raw `<input>` → `<Input>` (also fixes `:focus`→`focus-visible`).
- `ReviewForm.tsx`: inputs → `<Input>`/`<Textarea>` wrapped in `<Field label required>`; submit → `<Button variant="brand" loading={submitting}>` (gains spinner); 3 message divs → `<Alert tone="info|success">`.
- `ReviewList.tsx`: "Load more" → `<Button loading>`; empty → `<EmptyState>`.
- `ProductGrid.tsx`: empty div → `<EmptyState icon={Package} title description>`.
- `AddToCartSection.tsx`: CTA → `<Button variant="brand">`; success/error → `<Alert>`.
- `MobileBuyBar.tsx`: CTA → `<Button variant="brand">`.

**Keep (audit over-flagged — correct as-is):**
- Pagination prev/next/number `<Link>` and category-filter `<Link>` — these are **navigation**, not buttons; forcing `<Button>` would regress. Leave as styled links.
- Discount sale badge — uses tenant `--color-sale-badge-bg`; `<Badge>` tones don't map to it. Keep custom (acceptable themed exception).

### Theme E — a11y
- `ActiveFilters.tsx`: add translated `aria-label` to the two X remove buttons; bump touch target to ≥40px (`py-2`).
- `AddToCartSection.tsx`: add `aria-label` to qty −/+ buttons (MobileBuyBar already has them — match it).
- `VariantOptions.tsx`: add `focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]` to option chips.

### Theme F — loading skeletons (low priority)
- `products/loading.tsx`: align shadow class to page (`shadow-[var(--shadow-xs)]`).
- `products/[slug]/loading.tsx`: add skeleton blocks for trust-signals + description + reviews to reduce CLS (the file's own comment calls it "approximate by design" — keep it approximate but closer).

---

## Wave 2 — Rest of storefront (same patterns)
Wave 2 needs its **own discovery pass** (not yet audited). Run greps, then apply Wave-1 patterns:
```
rg "৳|toLocaleString\(\)" src/app/\(storefront\) src/features --glob '!**/admin/**'   # currency
rg "<input|<select|<textarea|<button" src/features --glob '*.tsx'                        # raw controls
rg '\|\| "[A-Z]' src/app/\(storefront\) src/features                                     # hardcoded fallbacks
```
Target areas: `cart/`, `checkout/`, `account/`, storefront `page.tsx` (home), `src/shared/components/storefront/*`, and the `features/{cart,orders,auth,coupons}` components they import. Reuse the Step-0 `formatMoney` helper and the i18n keys/namespaces created in Wave 1.

---

## Critical files (Wave 1)
- `src/shared/components/ui/Price.tsx` (export `formatMoney`)
- `messages/en.json`, `messages/bn.json` (new keys + `reviews`/`productSort`/`socialOrder` namespaces)
- `src/features/products/components/`: `ProductCard.tsx`, `ProductDetailClient.tsx`, `MobileBuyBar.tsx`, `BulkPricingTable.tsx`, `SortDropdown.tsx`, `ActiveFilters.tsx`, `SearchFormWithTracking.tsx`, `ProductGrid.tsx`, `AddToCartSection.tsx`, `VariantOptions.tsx`, `ProductImageGallery.tsx`, `SocialOrderButtons.tsx`
- `src/features/reviews/components/`: `ReviewSection.tsx`, `ReviewForm.tsx`, `ReviewList.tsx`
- `src/app/(storefront)/products/page.tsx`, `products/[slug]/page.tsx`, `products/loading.tsx`, `products/[slug]/loading.tsx`

## Reuse (don't reinvent)
- `<Price>` + new `formatMoney` — all currency.
- `<Button>`/`<Input>`/`<Textarea>`/`<Select>`/`<Field>`/`<Alert>`/`<EmptyState>`/`<Badge>` from `@/shared/components/ui`.
- `useLocale()` (next-intl), `useTenant()` (`IStore.currency`), `t()` from `@/shared/lib/i18n` for `LocalizedString` fields.

## Verification
1. `npx tsc --noEmit` — strict types pass.
2. `npm run build` — no build errors.
3. `npm run dev`; visit `http://shirts.localhost:3000/products` and a product detail page.
4. Switch locale to `bn` (`/api/locale` or `locale` cookie) and confirm: all audited strings render Bengali, prices show **Bengali numerals**, currency symbol matches `store.currency`.
5. a11y: keyboard-tab the listing + detail + review form — every control shows a visible focus ring; icon-only buttons announce a label (screen reader / inspect `aria-label`).
6. Empty states: a store/category with no products → `<EmptyState>`; a product with no reviews → `<EmptyState>`.
7. Submit a review → `<Button>` shows spinner, `<Alert>` confirms.

---

## Appendix — full audit findings (raw, before dedupe)
Severity legend: **critical** (real defect / broken for users) · **high** (spec violation, user-visible) · **medium/low/nit**.

### ProductCard.tsx
- "New" + "★ Featured" badges hardcoded English (no i18n). — high
- "Only {stock} left" hardcoded. — medium
- Price + compareAt hardcoded `৳` + `toLocaleString()` (no locale) → English numerals for `bn`, breaks non-BDT. — high/critical

### SortDropdown.tsx
- `SORT_OPTIONS` labels hardcoded English; component has no i18n at all. — high
- Raw `<select>` instead of `<Select>` primitive. — critical (spec)

### ActiveFilters.tsx
- "Active filters:" hardcoded. — high
- Remove (X) buttons missing `aria-label`. — medium (a11y)
- Remove buttons below 40×40 touch target (`px-3 py-1`). — low
- Filter chips hand-rolled vs Badge/Button. — spec

### SearchFormWithTracking.tsx
- Raw `<input>` instead of `<Input>`; uses `:focus` not `focus-visible`. — high (a11y/spec)

### products/page.tsx
- Redundant `t("x") || "English"` fallbacks (showing/of/productsLabel) — keys exist. — medium nit
- Category URL param not `encodeURIComponent`'d (low risk; slugify usually safe). — low
- Pagination/category links inline-styled (kept — navigation). — nit

### products/loading.tsx
- Sidebar always rendered but page renders it conditionally → CLS if no categories. — low
- `shadow-xs` vs page's `shadow-[var(--shadow-xs)]`. — nit

### products/[slug]/page.tsx
- `tr(...) || "English"` fallbacks: Free Shipping / Easy Returns / Secure Checkout. — medium

### products/[slug]/loading.tsx
- Skeleton only covers gallery+info; omits trust/description/reviews → CLS. — medium (agents disagreed; low priority)

### ProductImageGallery.tsx
- Hardcoded: "No Image", "Hover to zoom · Click to expand", "Reset", keyboard hints. — high

### AddToCartSection.tsx
- "Added to cart!" toast hardcoded. — medium
- CTA hand-rolled `<button>` w/ inline bg, no focus ring. — medium (a11y/spec)
- Qty −/+ icon buttons missing `aria-label`. — high (a11y)
- Quantity spinner hand-rolled vs Field. — medium
- Success/error message inline vs `<Alert>`. — low

### ProductDetailClient.tsx
- Price / compareAt / bulk line total hardcoded `৳`. — high/critical
- "piece"/"pieces" hardcoded. — medium
- Manual 5-star render duplicates ReviewStars. — code dup
- Discount badge inline vs Badge (kept — themed token). — note
- Stock status inline divs. — low

### MobileBuyBar.tsx
- "Qty" hardcoded. — medium
- CTA hand-rolled button, no focus ring. — medium
- Hardcoded `৳` in CTA label. — high
- (Qty buttons correctly have aria-label — reference for AddToCartSection.)

### SocialOrderButtons.tsx
- `DEFAULT_TEMPLATE` order message entirely hardcoded English. — high

### BulkPricingTable.tsx
- Default labels English: "Bulk Pricing", "per piece", "Total", "Buy", "base". — medium
- Tier prices hardcoded `৳`. — medium

### ReviewSection.tsx
- Hardcoded: "Customer Reviews", "out of 5", login prompt, "already reviewed", "only purchasers". — high
- Three message boxes inline vs `<Alert tone="info">`. — high (spec)

### ReviewForm.tsx
- Entire form un-i18n'd (titles, labels, placeholders, buttons, toasts). — high
- Raw `<input>`/`<textarea>` vs `<Input>`/`<Textarea>`. — critical (spec)
- Submit button hand-rolled; no `loading` spinner. — critical (real defect)
- 3 message divs vs `<Alert>`. — high
- Manual `<label>` + `*` vs `<Field required>`. — medium (a11y)

### ReviewList.tsx
- Empty state hand-rolled `<p>` vs `<EmptyState>`. — high
- "Load more" hand-rolled button, no spinner. — high
- "No reviews yet…" hardcoded. — medium

### ProductGrid.tsx
- Empty state hand-rolled div vs `<EmptyState>`. — critical (spec)

# Deep Bug Analysis — Storefront Products / Cart / Reviews

Method: 4 parallel deep-analysis agents (selection+pricing · cart · listing/filters · gallery/reviews), then every CRITICAL/HIGH claim re-verified by reading the exact source lines. Scope: product detail + listing path, the shared cart context, and reviews. Style/i18n issues are NOT here — see `STOREFRONT_SPEC_SWEEP_PLAN.md`.

**Verified clean (no bug):** storeId isolation on every product/review/cart query; `sort` is all-listed (no ORDER BY injection); order totals are recomputed server-side from live price (no overcharge exploit — all price mismatches below are *display-only*); no cart SSR hydration mismatch; no gallery listener leaks.

---

## CRITICAL

### C1 — `?page=0` / `?page=-1` / `?page=abc` crashes the listing page (500)
`src/app/(storefront)/products/page.tsx:44` → `src/features/products/repository.ts:190-192`
```ts
const page = parseInt(params.page || "1", 10);   // no NaN guard, no clamp
const skip = (params.page - 1) * params.limit;   // page 0 → -12 ; "abc" → NaN
... .offset(skip)                                // Postgres: OFFSET must not be negative / invalid
```
Public GET param. `?page=0`/`?page=-5` → negative OFFSET → DB error → 500. `?page=abc` → `OFFSET NaN` → 500. `?page=99999` → empty grid, no empty-state.
**Fix:** `const page = Math.max(1, Number.isFinite(n) ? n : 1)`, then clamp to `totalPages` after the count is known (or clamp `skip` in repo). Confidence: HIGH.

---

## HIGH

### H1 — Incomplete / non-existent variant combo is purchasable at base price
`src/features/products/hooks/useProductSelection.ts:68-78,108-109` · `ProductDetailClient.tsx:164`
When no variant matches the selection (`activeVariant = null`), `displayPrice`/`displayStock` fall back to `product.price`/`product.stock`, and `addToCart` only guards `displayStock <= 0` — there is **no `hasOptions && !activeVariant` guard**. So an incomplete selection, or a non-existent combo seeded from a crafted/shared URL (`?Color=Blue&Size=M`, both valid values but no such variant — the `useState` initializer at `:45-57` accepts any value in `o.values`), adds to cart at the **base product price against base stock**.
**Fix:** disable Add-to-Cart whenever `hasOptions && !activeVariant`; treat unmatched selection as unavailable (not a fallback to base). Ties to the already-filed sibling-prune fix. Confidence: HIGH.

### H2 — Quantity not re-clamped on variant change → add qty &gt; stock
`useProductSelection.ts:42,78,108-109` · `AddToCartSection.tsx:75` · `MobileBuyBar.tsx:156` · `CartContext.tsx:147-160`
`+` clamps to the *current* `displayStock`, but switching to a lower-stock variant never re-clamps the existing `quantity`; `addToCart` doesn't check `quantity > displayStock`; the cart `addItem`/`updateQuantity` have no stock ceiling either. Repro: variant A stock 20 → qty 15 → switch to variant B stock 2 → Add to Cart adds 15. Order API rejects at placement → guaranteed dead-end checkout (not an oversell, but bad UX + lets qty cross unreachable bulk tiers).
**Fix:** clamp `quantity` to `displayStock` whenever `activeVariant` changes (effect or derived); enforce ceiling in cart `addItem`/`updateQuantity`. Confidence: HIGH.

### H3 — Same variant splits into duplicate, un-removable cart lines (key-order)
`src/shared/context/CartContext.tsx:95-103` · `ProductDetailClient.tsx:112-113`
```ts
JSON.stringify(a.variantSelections) === JSON.stringify(b.variantSelections)  // order-sensitive
```
Chip selection builds `selectedOptions` in `product.options` order; clicking a **variant image** does `setOptions(variant.optionValues)` (`:113`), whose key order is whatever the DB stored. `{Color,Size}` vs `{Size,Color}` serialize differently → two lines for one physical variant, and `updateQuantity`/`removeItem` (which match by the same stringify) can't touch the other copy. (The dead DB repo path compares jsonb order-independently — correct — but it's unused.)
**Fix:** canonicalize key order before compare/store, e.g. `stableStringify` or build the key from `product.options` order. Confidence: HIGH.

### H4 — "Showing X–Y of Z" renders nonsense on empty / out-of-range
`src/app/(storefront)/products/page.tsx:210-216`
`result.total = 0` → "Showing 1–0 of 0"; `?page=50` of 3 pages → "Showing 589–30 of 30"; `?page=abc` → "Showing NaN…". Distinct from C1 (stays wrong even after the crash is fixed) — needs a `total === 0` guard + clamped page.
Confidence: HIGH.

### H5 — Review list pagination (OFFSET) duplicates/skips rows + React key collision
`src/features/reviews/components/ReviewList.tsx:50-79` · `repository.ts:52`
`OFFSET=(page-1)*limit` ordered `createdAt desc`, `loadMore` appends. A review approved between page-1 render and a `loadMore` shifts the window → the boundary item re-serves at offset 10 → duplicate row with duplicate `key={review._id}`; a deletion → skipped row.
**Fix:** keyset/cursor pagination (`createdAt < lastSeen`), or de-dupe by `_id` on append. Confidence: HIGH (mechanism); trigger window is narrow.

---

## MEDIUM

### M1 — Bulk-tier price ignores variant price; PDP preview ≠ checkout per-line ≠ subtotal (display-only)
`useProductSelection.ts:115-116` · `ProductDetailClient.tsx:94-100` · `CartContext.tsx:264-312` · `checkout/page.tsx:535`
Tier math always uses `product.price` and ignores a variant's own `price`; PDP headline shows the variant price while the bulk preview uses base price; checkout per-item line uses raw `priceAtAdd*qty` (not tier-aware) so the rows don't sum to the tier-aware subtotal. Charged total is correct (server recomputes) — this is a *shown-math* inconsistency only.
**Fix:** make the displayed breakdown use the same `computedLines` source everywhere; decide variant-vs-tier precedence and apply it consistently. Confidence: HIGH (mismatch is real), impact MEDIUM (display).

### M2 — Category sidebar counts include inactive products; "All" excludes them
`src/features/products/repository.ts` `countByCategoryIds` (no `isActive` filter) vs `findByStore` (defaults `isActive=true`)
Sidebar "All" = active only; per-category badge = active+inactive → badges don't reconcile and over-count what the category page then shows. Also ignores the active `search`.
**Fix:** add `eq(products.isActive, true)` to `countByCategoryIds`. Confidence: HIGH.

### M3 — Review submit gives no list/count/average feedback until reload
`src/features/reviews/components/ReviewSection.tsx:83` (no `onSuccess`) · `ReviewForm.tsx:89-90`
`<ReviewForm>` is rendered without `onSuccess`; count/avg are static server props. New review (pending approval) never reflects; even post-approval there's no refresh path — only the success banner. Partly by-design (approval gate) but zero list-area feedback.
**Fix:** wire `onSuccess` to refetch the list/stats (or router.refresh()). Confidence: HIGH.

### M4 — Gallery `src` vs `variants`/`blur` mismatch at index 0
`src/features/products/components/ProductImageGallery.tsx:44-47,159-161`
`currentSrc` prefers `thumbnail` whenever `selectedIndex === 0`, but the `StoreImage` `variants`/`blurDataURL` come from `images[0]`. If a store sets a thumbnail distinct from `images[0].url`, you get the thumbnail bitmap with `images[0]`'s srcset/blur → wrong responsive image. Confidence: HIGH.

### M5 — Gallery controlled `selectedIndex` not clamped to `images.length`
`ProductImageGallery.tsx:26,43` — `images[selectedIndex]` used raw; safe for the current single-product caller but the component contract is unsafe if the array shrinks while the parent index lags. Confidence: MEDIUM.

### M6 — Review photo `removeImage`/key by URL breaks on duplicate URLs
`ReviewForm.tsx:49,58-60,180` — filter+`key` by URL; if two uploads return the same URL, removing one removes both + React key collision. Depends on whether `generateFileKey` randomizes. Confidence: MEDIUM.

---

## LOW

- **L1** Variant change drops the URL `#hash` fragment (`useProductSelection.ts:82-91`, `replaceState("?"+qs)`). URL-sync does NOT clobber `page/search/sort/utm` — those are preserved (disproven).
- **L2** `search` not trimmed/normalized server-side (`page.tsx:46`); `?search=%20%20` matches everything and shows an empty filter chip; `%`/`_` pass into ILIKE as wildcards. Tracking trims, the query doesn't (inconsistent).
- **L3** Submitting the search form drops active `category`/`sort` (plain GET form) — possibly intended ("new search resets context").
- **L4** `loadMore` swallows non-OK responses silently → dead button, no toast (`ReviewList.tsx:54-55`); no AbortController (setState-after-unmount).
- **L5** Gallery pan offset unbounded → image draggable fully off-screen until Reset (`ProductImageGallery.tsx:111-124`).
- **L6** Gallery wheel-zoom uses unnormalized `deltaY` (`deltaMode` ignored); a hard scroll can snap zoom to 1 (`:72-77`).
- **L7** TOCTOU on review create: check-then-insert races the `uq_reviews_store_user_product` unique index → ugly DB error instead of friendly "already reviewed" (`reviews/service.ts:20-30`).
- **L8** Cart localStorage key is global `"cart"`, not `cart:${storeId}` — safe under subdomain tenancy (origin-isolated + storeId guard wipes mismatches), but path-based/shared-origin tenancy would let one store wipe another's cart (`CartContext.tsx:93,128-131`).
- **L9** `add_to_cart` analytics event omits quantity/variant/price (`useProductSelection.ts:128-133`) — data gap.
- **L10** Redundant query: store-wide total fetched via `getByStore({page:1,limit:1})` just to read `.total` instead of `countByStore` (`page.tsx:71`); category-count round-trip is serial after `Promise.all` (`page.tsx:75-80`). Perf only.

---

## Suggested fix order
1. **C1** (crash) — trivial guard, public 500.
2. **H1 + H2** (selection → cart correctness) — bundle with the already-approved sibling-prune fix in `useProductSelection`.
3. **H3** (duplicate cart lines) — canonicalize variant key.
4. **H4 + M2** (listing display/counts) — same file as C1.
5. **H5 + M3** (reviews) — pagination de-dupe + onSuccess refresh.
6. Gallery M4/M5 + the LOW batch as polish.

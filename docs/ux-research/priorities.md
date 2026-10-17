# UX priorities (step 4)

Every idea from the 13 reference reports and `our-storefront.md`, ranked by **expected impact vs. effort**. The user picks what to build; picked items go to step 5 (prototype).

- **Goal it's judged against:** on a phone, a shopper notices products fast and trusts the store enough to buy. Mostly BD customers, three store types (shoes, punjabi, shirts).
- **Impact:** **H** = moves "see product → add to cart → order" directly, or fixes a trust break. **M** = clear improvement for some shoppers or one store type. **L** = polish.
- **Effort:** **S** = UI only, existing data, ≤ ½ day. **M** = new component or query, maybe a new primitive variant, 1–2 days. **L** = schema + migration + admin form + i18n, or a new feature, 3+ days.
- **Data already there** (checked in code, so no schema work needed): store `deliveryConfig` (inside/outside Dhaka fee) and `refundPolicy`, campaigns with `startDate`/`endDate`, review `images[]`, variant images, listing queries that already load variants, product `tags` (GIN-indexed).
- **Missing data:** no product field for specs / size chart / model size / fit, no review fit field, no wishlist table, `/products` has no price or tag filter.
- Already fixed separately: ৳0 variant price and add-to-cart without size (PR #1).

---

## Tier 1: quick wins (impact H/M, effort S)

| ID | Idea | Seen at | Impact | Effort | Where | Measure later |
|---|---|---|---|---|---|---|
| **Q1** | **Compact trust strip from real store data**: one row of 3–4 short items (COD, inside/outside Dhaka fee, return/exchange days), read from `deliveryConfig` + `refundPolicy` instead of the global copy. No truncation. | Yellow, Allbirds, Bata, Manyavar | **H** | S | `app/(storefront)/page.tsx:69-118`, `shared/lib/delivery.ts`, `stores/types.ts:130` | Trust-strip view → checkout start |
| **Q2** | **Delivery / COD / returns rows next to the PDP CTA** (Daraz-style summary rows, the store's real numbers, "Cash on delivery available"). Replaces the generic trust row. | Daraz, Bata, Fabindia, Manyavar | **H** | S | `products/[slug]/page.tsx:99-110` | Add-to-cart rate with vs. without, inside vs. outside Dhaka |
| **Q3** | **First product on the first mobile screen**: Q1's compact strip, a smaller category header, a max hero height on mobile. Target first card ≤ 600px. | Ecstasy, Sailor, Bata, Daraz, Nike | **H** | S | `page.tsx:122-123`, `HeroBanner.tsx:241` | Scroll depth to first card; card CTR |
| **Q4** | **Size chips visible on the mobile PDP** (reuse `VariantOptions` inline, not only in the sheet). The sticky bar then adds directly or shows "Please select Size". | Allbirds, Nike, Bata, Gymshark, Sailor, Manyavar, Fabindia | **H** | S–M | `ProductDetailClient.tsx:222`, `MobileBuyBar.tsx` | Size-selected rate, add-to-cart rate |
| **Q5** | **WhatsApp / Messenger on the page**: a persistent chat FAB (not call-only), and on the PDP an inline "Order on WhatsApp" button prefilled with product + size. **Require a size first** (follow-up from PR #1). | Sailor, Fabindia, Ecstasy, Bata | **H** | S–M | `FloatingCallButton.tsx:24-47`, `SocialOrderButtons.tsx`, `MobileBuyBar.tsx:181` | WhatsApp taps per PDP view → orders |
| **Q6** | **Remove fake social proof**: the coloured-circle "avatars" + "Join 2,000+"; show the rating only when approved reviews exist (header vs. list mismatch); a minimum review count for stars on cards. | (anti) Yellow, Sailor, Manyavar | **M** | S | `page.tsx:345-362`, `ReviewSection.tsx:44-70`, `ProductCard.tsx:125` | — (trust hygiene) |
| **Q7** | **Shrink the newsletter block** (≈1,000px) or move it to the footer, so it doesn't push products down. | Allbirds, Aarong, Sailor | **M** | S | `page.tsx:281-409` | Signup rate before vs. after |
| **Q8** | **Spec cleanup bundle**: translate the ~12 hard-coded English strings; remove "★ FEATURED"; replace the "Hover to zoom" pill and hover-only buttons with touch-friendly ones; stop the endless pulse animations; use `<Price>` everywhere with whole-taka prices. | (CLAUDE.md spec) | **M** | S | List in `our-storefront.md` "Bengali check" + "mistakes" | bn session conversion |
| **Q9** | **Add-to-cart toast with "View cart"** (and translated text, not "Add to Cart ✓"). | — | **M** | S | `MobileBuyBar.tsx:64`, `AddToCartSection.tsx:46` | "View cart" taps |
| **Q10** | **"You save ৳X"** next to the price, plus rating stars that **link to the reviews**. | Daraz, Gymshark, Uniqlo | **M** | S | `ProductDetailClient.tsx:120-171` | Review-section reach |
| **Q11** | **Pause control on the hero carousel**. Auto-moving content longer than 5s needs one under WCAG 2.2.2. | Gymshark | **M** | S | `HeroBanner.tsx:11,120` | — (a11y) |
| **Q12** | **SEO fixes**: JSON-LD `priceCurrency` BDT, absolute image URLs, a category level in the breadcrumb, a homepage `h1`. | Yellow, Sailor, Nike | **M** | S | `shared/lib/seo.ts:62,67`, `products/[slug]/page.tsx:58-89` | Search impressions (Search Console) |
| **Q13** | **Responsive PDP main image** (`srcset` variants instead of the full original on phones). | Gymshark (anti: Yellow, Allbirds, Zara) | **M** | S | `ProductImageGallery.tsx:163`, `StoreImage.tsx:115` | Mobile LCP, image bytes per PDP |

## Tier 2: big wins (impact H/M, effort M)

| ID | Idea | Seen at | Impact | Effort | Where | Measure later |
|---|---|---|---|---|---|---|
| **M1** | **Swipe gallery** (native scroll-snap) with a "1 / N" counter, tap to open the lightbox, pinch zoom. | Allbirds, Nike, Gymshark, Uniqlo, Yellow, Daraz | **H** | M | `ProductImageGallery.tsx:142-223` | Images viewed per session |
| **M2** | **Related-products rail on the PDP**: "Similar" (same category, close price) + "You may also like" (cheaper), same store only. One-tap add on the cards once M5 exists. | Aarong, Yellow, Fabindia, Bata, Manyavar, Nike, Zara, Daraz | **H** | M | New `ProductRepository.findRelated(storeId, …)`; `products/[slug]/page.tsx` | Rail CTR, attach rate |
| **M3** | **Swipe product rail with a peeking card, right under the hero**, plus tabs or chips (category / Men-Women) instead of two duplicate grids (New vs Featured are the same products today). | Ecstasy, Allbirds, Nike, Bata, Sailor | **H** | M | `page.tsx:202-278`, `service.ts:62-68` | First-rail CTR by position |
| **M4** | **Large 2-column category photo tiles** instead of 80px circles. Needs real category photos (content). | Aarong, Yellow, Bata, Sailor, Ecstasy | **M–H** | S–M | `page.tsx:163-186` | Category-tile clicks |
| **M5** | **Quick add "+" on product cards**: opens the size sheet (reuses `BottomSheet` + `VariantOptions`), never adds without a size. | Yellow, Zara, Gymshark, Allbirds | **M–H** | M | `ProductCard.tsx:32-36` | Quick adds vs. PDP adds |
| **M6** | **In-stock sizes on product cards** ("8 9 10 +1"). Variants are already loaded on listings. | Bata, Uniqlo | **M** | S–M | `ProductCard.tsx` | Card CTR |
| **M7** | **Per-store image ratio**: 4:5 for apparel (punjabi, shirts), 1:1 for shoes. A theme setting used by cards + gallery. | Yellow, Fabindia, Sailor, Gymshark / Allbirds, Bata | **M** | M | `ProductCard.tsx:38`, `ProductImageGallery.tsx:143`, store theme | Card CTR per store |
| **M8** | **Budget + occasion tiles**: "Panjabi under ৳1,500", "Eid", "Wedding". Needs `minPrice`/`maxPrice`/`tag` filters on `/products`. | Fabindia, Bata, Manyavar, Gymshark | **M** | M | `products/page.tsx:30-36`, product repository | Tile clicks vs. plain categories |
| **M9** | **Reviews upgrade**: customer photos first (already stored), rating histogram, "% would recommend". | Gymshark, Uniqlo, Daraz, Nike, Manyavar | **M** | M | `features/reviews/components/*` | Review reach → conversion |
| **M10** | **Colour swatches from variant photos** (on the PDP, then on cards). Variant images already exist. | Fabindia, Nike, Gymshark, Uniqlo, Yellow | **M** | M | `VariantOptions.tsx:343-371` | Colour switches, add rate |
| **M11** | **Less fixed chrome on the PDP**: the sticky buy bar and the tab bar together take 120px; merge them or hide the tab bar on the PDP. | Daraz, Gymshark, Zara | **M** | M | `MobileBuyBar.tsx:81`, `MobileBottomNav.tsx:273` | Sticky bar taps |
| **M12** | **"Buy now" express button** next to Add to cart (goes straight to checkout). | Yellow, Bata, Sailor, Daraz | **M** | M | `MobileBuyBar.tsx:107-119` | Buy-now vs. cart path conversion |
| **M13** | **Per-size "N left"** (only when low) and **"Notify me"** on sold-out sizes. Notify needs the notifications/subscribers feature. | Manyavar | **M** | M–L | `VariantOptions.tsx` | Notify sign-ups → restock orders |
| **M14** | **Real flash sale with countdown**, driven by campaign `endDate` (never fake timers). | Daraz | **M** | M | `features/campaigns` | Campaign-period conversion |
| **M15** | **Accordions** (description / delivery / returns) and **sticky section tabs** on long PDPs. Matters most once L1 adds content. | Allbirds, Aarong, Uniqlo, Daraz | **L–M** | M | `products/[slug]/page.tsx:113-153` | Section opens |
| **M16** | **Campaign banner followed by its product rail** (a banner links to a collection, and the rail shows it). | Nike | **M** | M | `HeroBanner.tsx`, `page.tsx` | Banner → product clicks |
| **M17** | **Recently viewed rail** (localStorage, same store). | Yellow, Sailor | **L–M** | M | new component | Return-visit clicks |
| **M18** | **Search suggestions** (products + categories as you type). | Daraz, Uniqlo, Nike | **M** | M | `MobileBottomNav.tsx:155-190` | Search → PDP rate |

## Tier 3: needs new product data (effort L)

One migration (a localized `details` jsonb on `products`, plus a store- or category-level size chart) unlocks **L1–L3** together.

| ID | Idea | Seen at | Impact | Effort | Measure later |
|---|---|---|---|---|---|
| **L1** | **Structured spec table** (fabric, fit, collar, sleeve, length, care, dispatch time), open by default, plus a **fit-type line under the title** ("Slim fit", "Long, 44 in"). Big for punjabi. | Aarong, Fabindia, Bata, Ecstasy, Gymshark | **H** | L | Spec views; size-related returns |
| **L2** | **HTML size guide** with a cm/inch toggle and "how to measure" (shoes: our size ↔ foot length ↔ EU/UK/US). It also appears as the last gallery slide. | Fabindia, Manyavar, Bata, Ecstasy, Uniqlo | **H** | L | Guide opens vs. exchanges |
| **L3** | **Model height + size worn** on the PDP. | Uniqlo, Yellow, Ecstasy, Fabindia | **M** | S after L1 | — |
| **L4** | **Fit verdict from reviews** ("Customers say it fits true to size"). Needs a fit question in the review form, shown only above a minimum count. | Gymshark, Uniqlo, Sailor | **M–H** | L | Fit-note views vs. returns |
| **L5** | **Complete the look / bundle**: the admin links products (panjabi + pajama + nagra), with one "Add all" button. Same store only. | Manyavar, Nike, Gymshark, Zara, Uniqlo | **M–H** | L | Attach rate, order value |
| **L6** | **Wishlist** (heart on cards + PDP; guest in localStorage, synced after login). | Aarong, Sailor, Uniqlo, Gymshark, Manyavar, Bata | **M** | L | Wishlist → purchase |
| **L7** | **Q&A in Bengali** on the PDP. | Daraz | **M** | L | Questions asked; conversion after an answer |

## Tier 4: low priority / polish

| ID | Idea | Seen at | Impact | Effort | Note |
|---|---|---|---|---|---|
| P1 | Hide-on-scroll header | Nike, Gymshark | L | S | Frees 64px while scrolling |
| P2 | Short promo hero layout for sale periods | Sailor, Bata | L | S | A variant of `HeroBanner` |
| P3 | "Highly rated" badge on the first image (threshold-based) | Nike | L–M | S | Only after reviews are real (Q6) |
| P4 | Tags as links to filtered grids ("best for" chips) | Allbirds, Gymshark | L | S after M8 | |
| P5 | Numbered "Top 10" rail from real sales | Gymshark | L–M | M | Needs order data |
| P6 | Mobile menu with photo tiles; shop by size | Zara, Bata | L–M | M | We have no mobile menu today |
| P7 | Honest "N sold" / "N viewing" counts from analytics | Daraz, Gymshark | L–M | M | Show only real numbers, above a threshold |
| P8 | Spec comparison rows under related products | Uniqlo | L | M after L1 + M2 | |

## Not recommended

- **Find in store / store stock** (Aarong, Sailor, Uniqlo, Zara, Nike): no per-location stock model, and most tenants are online-only.
- **Geo / country detection** (Zara): the tenant is already resolved by domain.
- **Fake urgency** of any kind: rotating "someone just bought" pop-ups, viewer counts without data, timers that reset. The reports show BD shoppers distrust them, and they break Q6.
- **Pop-ups, app-install banners, extra tracking scripts**: zero third parties and no interstitials is currently our biggest advantage over all 13 sites. Keep it.

---

## Suggested first batch

If you want one recommendation: **Q1 + Q2 + Q3 + Q4 + Q5 + M1 + M2**.

- They cover the whole "notice → trust → buy" path on mobile: products on the first screen, real COD/delivery/returns info where the decision happens, visible sizes, a swipeable gallery, WhatsApp ordering, and no dead-end PDP.
- None needs a migration. All the data already exists.
- **Q6–Q13** are spec cleanup with little visual design risk. They could go straight to implementation as one PR, without a prototype.

## Picked (2026-10-16)

The user picked the suggested batch for step 5: **Q1, Q2, Q3, Q4, Q5, M1, M2**.

## Prototype verdict (step 5)

Prototype: branch `prototype/ux-attention`, commit `4cd1fda` (`?variant=A|B|C` on `/` and `/products/[slug]`).

- **Homepage: A, "Short hero + rail".** A 16:9 hero on mobile → one line of trust chips from the store's real config (COD, inside/outside Dhaka fee, exchange days) → a "New arrivals" swipe rail with peeking cards → category chips → 2-column category photo tiles. The first product moves from 1,354px to about 390px.
- **PDP: A, "Stack + rows".** A swipe gallery with a "1 / N" counter → title, rating (links to the reviews), price + "You save ৳X" → size chips inline on mobile → delivery / COD / returns rows from the store config → Add to cart · ৳X + "Order on WhatsApp" (both need a size) → "Similar products" rail. The sticky buy bar appears only after the inline CTA scrolls away.
- Not chosen: homepage B (no hero up top) and C (tall hero with a trust overlay); PDP B (price above the gallery, always-on duo bar) and C (compact box with a merged bottom bar).

## Built in step 6: measure later, and what was left out

**Measure later** (with the `analytics` feature; `useTrackEvent` already sends `product_view` and `add_to_cart`):

| Change | Measure |
|---|---|
| Q1 trust chips (homepage) | Homepage → PDP click-through and checkout-start rate before vs. after |
| Q3 compact hero + rail | Scroll depth to the first product card; "New arrivals" rail card clicks by position |
| Q2 delivery/COD/returns rows | Add-to-cart rate per PDP view, split inside vs. outside Dhaka (from checkout district) |
| Q4 inline sizes | Size-selected rate; "Please select Size" toasts per add attempt (should fall) |
| Q5 WhatsApp / Messenger | Taps per PDP view, taps blocked for a missing size, orders that follow |
| M1 swipe gallery | Images viewed per PDP session; lightbox opens |
| M2 similar-products rail | Rail impressions, card clicks, attach rate (second product in the same order) |
| Sticky buy bar | Taps on the bar vs. the inline CTA |

**Left out on purpose** (step 7 review), each tracked as a follow-up:

- **Store currency:** prices and fees are formatted as BDT (`formatPrice(x, "BDT")`), as the rest of the storefront already does. Reading `store.payment.currency` would turn the seed stores ("USD") into `$` prices, which is a separate product decision.
- **Compact mobile height for the other hero layouts** (split, centered, minimal, grid): only the default slider got it. Stores on other layouts don't yet meet Q3's ≤ 600px target.
- **Pinch zoom (M1) and a persistent WhatsApp chat button (Q5):** not part of the approved variant A.
- **Section spacing:** the new homepage sections are denser than CLAUDE.md's `py-8 md:py-10` on purpose (Q3). Propose a spec change in CLAUDE.md alongside the PR.

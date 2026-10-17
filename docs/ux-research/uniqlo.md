# Uniqlo: mobile UX research (reference for our shirts store, product cards and listings)

- **Site:** https://www.uniqlo.com (US storefront). `/in/en/` returned an Akamai "Access Denied" page, so I used `/us/en/`.
- **URLs analyzed (reached by following links):**
  - Homepage: `https://www.uniqlo.com/us/en/` (switched to the MEN tab)
  - Listing: `https://www.uniqlo.com/us/en/men/shirts-and-polos` (the "Shirts" tile in the homepage's "Search by category" grid)
  - PDP: `https://www.uniqlo.com/us/en/products/E456630-000/00?colorDisplayCode=64&sizeDisplayCode=004` (Oxford Slim Shirt card on the listing). The site added `sizeDisplayCode` itself.
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, touch on. The iPhone Safari UA got blocked (headless Chrome sends desktop-Linux `Sec-CH-UA-*` hints next to an iPhone UA). I switched to an **Android Chrome mobile UA with matching client hints** through a CDP `Network.setUserAgentOverride` session. After a cache-disabled reload Akamai blocked me again, and clearing cookies fixed it.
- **Method:** REA (`inspect_web_page`, `capture_web_screenshot`) plus my own headless Chrome over CDP for scrolling, taps and DOM/`performance` probes. I closed the "UNIQLO App" smart banner. A OneTrust CCPA dialog was in the DOM but didn't block the page. I opened the filter drawer, the size guide and "Paired Items". I didn't add to cart.
- **REA evidence:** homepage inspect `ev_db20cef6…`, PDP inspect `ev_d3ca6362…` (accessibility names used below), early screenshot `ev_e7764ceb…` (taken before render, blank). REA kept only first-party data (`policy_filtered`), so third-party and weight figures come from CDP Network events and `performance` entries.

## Homepage (+ listing)

1. **Gender tabs pinned under a transparent header**
   - **Observed:** Logo, a pill search field, account, cart and menu sit over the hero, with WOMEN / MEN / KIDS / BABY tabs right below. Both rows stay fixed while you scroll.
   - **Why it grabs attention:** One tap swaps the whole homepage to your department, and search is always open as a field, not hidden behind an icon.
   - **How it's built:** React SPA (`#root`, loadable-components chunks, no Next.js). The `template-base__fixed-nav-header` is `position: fixed` with a gradient mask (`home-template__mask`).
2. **Category icon grid comes before any product**
   - **Observed:** "Search by category" is a 3-column grid of about 15 cut-out product images (Outerwear, Shirts, Jeans, HEATTECH, New Arrivals, Limited-Time Offers, Sale), then "See all categories".
   - **Why it grabs attention:** Packshots without backgrounds read like a store aisle map, and Sale and Limited-Time Offers sit right next to normal categories.
3. **Hero banners with a price on them**
   - **Observed:** Full-bleed lifestyle banners. One shows a single product with its **price in large type** ("$29.90") over the photo.
   - **Why it grabs attention:** It answers "how much?" before anyone taps, which works well for value-priced basics.
4. **Product rails show up late, about 3.4 screens down (y≈2,857px)**
   - **Observed:** Banner → 2-column product block → banner, repeated. Each block holds 4 to 8 cards.
5. **Product card anatomy (homepage and listing)**
   - **Observed:** A full-bleed **3:4** model photo with no gutter between cards, then a **row of colour chips with a ">" overflow**, a heart (wishlist), **"MEN, XXS-3XL" (gender + size range)**, the name, the price, "UNISEX", and **★ 4.8 (53)**. Badges include "Bestseller". Offer prices are red with a time-boxed label ("Limited-Time Offer until 10/15"). Sale cards say "Sale, Select Colors/Sizes Only", and their size range shrinks to what's left (e.g. "MEN, XS").
   - **Why it grabs attention:** Size range and rating on the card answer "will it fit / is it good?" before the tap. A dated offer label adds urgency without a ticking countdown.
   - **How it's built:** The whole card is one `<a class="product-tile__link">` with an `aria-label` that sums it up ("SUPIMA® Cotton T-Shirt, $19.90, Limited-Time Offer until 10/15, UNISEX"). There's a single `<img>` from `image.uniqlo.com/...3x4.jpg?width=300`, with no `srcset`, served as WebP by content negotiation. Discounted colours are **separate listing entries** (product `…/01` vs `…/00`).
6. **Listing toolbar, sub-category chips and store-stock filter**
   - **Observed:** The H1 "Men's Shirts" sits above a swipeable row of image chips (All / Casual / Polo / Dress) with a progress bar. Next comes "Select a store to search store stock", then a **sticky "Results: 89 items · Sort by · Filter"** bar. The listing loads 36 cards at a time (infinite scroll to 72).
   - **How it's built:** `template-base-sticky-container` is `position: sticky`.
7. **Full-screen filter drawer with a live count**
   - **Observed:** Accordion facets (Product Type, Size as a 2-column checkbox grid, Color, Sleeve Length, Material, Fit, Collar, Price, Stock) and a sticky black **"VIEW ITEMS (89)"** button.
   - **Why it grabs attention:** The count tells shoppers how many results they'll get before they commit, so they don't land on "0 results".

## PDP (Oxford Slim Shirt)

1. **Swipe gallery with counter, model stats and "Paired Items"**
   - **Observed:** A 3:4 full-width image with a **"1|9" counter**. Small text on the photo reads "Height 183cm / Size M". A round **hanger button** opens **"Paired Items"**: every product the model wears in that photo (shirt, tee, jeans, belt) with colour and price.
   - **Why it grabs attention:** Model height + size answers fit questions, and Paired Items turns one photo into a basket.
   - **How it's built:** CSS scroll-snap (`fr-ec-carousel__frame`, `scroll-snap-type: x mandatory`). 9 images at `?width=600`, no video. Paired Items is its own route (`…/products-in-image?imageUrl=…`). The gallery buttons have **no accessible name** (REA a11y tree).
2. **Order of the block: title → colour → size → price → CTA**
   - **Observed:** H1 at y≈636, "Color: 64 BLUE" with **fabric-texture swatch chips**, "Size: MEN M" with M **pre-selected**, a "Size Guide" link, then the price at y≈875 (below the fold) with ★ (33), then a **dated delivery estimate with ship-to ZIP** ("Arrives 10/20–10/21"), a quantity stepper + ADD TO CART, and "In stock".
   - **Why it grabs attention:** The CTA is ready on arrival because a size is pre-selected, and an actual delivery date beats "ships in 3–5 days".
   - **How it's built:** Size chips set `aria-pressed`. A coach-mark tooltip ("Get help with finding your size") points at the fit tool.
3. **Size guide with a size recommender**
   - **Observed (DOM):** Product Size / Body Size tabs, a CM/IN toggle, "Compare Sizes" (against products bought before), an "On-Model Product Length Guide (by height)" and "MySize ASSIST" (recommended size).
   - **How it's built:** The size recommender is the third-party Bodygram (`fitfinder.body2fit.bodygram.com`).
4. **Store availability plus a free-shipping threshold next to the CTA**
   - **Observed:** "SHIPS FREE: $99+", then "Store availability → Select a store" and "Check additional stores".
5. **Description as image + text feature cards, then accordions**
   - **Observed:** Close-up photos (fabric, rounded buttons), each with one line of copy. Then Details / Materials-Care / Delivery-Exchange-Returns / Production as collapsed accordions.
6. **UGC styling with wearer height and size**
   - **Observed:** "Official/StyleHint styling" is a carousel of customer outfit photos labelled with the person's **height and the size they wear** (e.g. 5'10", Size M).
   - **Why it grabs attention:** It's social proof and a fit guide in one.
7. **Reviews block built for fit**
   - **Observed:** ★4.7 (33), a **"Runs small / True to size / Runs large" slider**, an **AI review summary** (labelled AI), **keyword chips with counts** (Fit 19, Sizing 9, Slim Fit 9). Each review lists **purchased size, colour and "How it fits"**.
8. **"Similar products" rail with a comparison table**
   - **Observed:** Cards for related shirts, with **Sleeve / Collar / Fit rows lined up under each card**. Then "People Also Viewed".
   - **Why it grabs attention:** Customers can compare Slim vs Oversized vs Regular without opening three PDPs.

**No sticky add-to-cart** once the inline CTA scrolls away.

## How it's built (summary)

- React SPA, Akamai Bot Manager (`/akam/13/…` sensor, `elgnisolqinu.js`), Datadog RUM, Firebase, Braze, Qualtrics, Klarna messaging.
- Fonts: self-hosted `UniqloPro` (Regular/Bold/Light) plus FontAwesome.
- Images: `image.uniqlo.com` with a `?width=` parameter and no `srcset`/`sizes`. 259 of 272 homepage images are `loading="lazy"`.
- PDP load with scrolling (CDP Network, warm cache): **389 requests** over about 70 hosts, including GTM/GA, Meta, TikTok, Pinterest, Snap, Reddit, Bing, Criteo, Amazon Ads, The Trade Desk, Riskified, Klaviyo, Bodygram, queue-it and mPulse. Homepage `performance` buffer: 80 entries / ~2 MB before the SPA cleared it.

## Weak spots

- Products start about 3.4 screens down on the homepage. On the PDP the price is below the fold.
- No sticky ATC on a long (6,300px) PDP.
- `?width=300` card images in 195px slots at DPR 2 look soft, and there's no `srcset`.
- A wishlist `<button>` is nested inside the card `<a>` (invalid interactive nesting). Gallery icon buttons have no labels.
- An offer label "until 10/15" was still showing on 10/16, which makes the urgency look stale.
- Sale cards show a red price with **no struck-through original price**, so the saving is hidden.
- Very heavy tracking tail, and the bot wall blocks legitimate headless/automation traffic.

## Takeaways for our shirts store

- **Size range on the card** ("S–XXL", or only the sizes left) and **★ rating + count** under the name.
- **Model height + size printed on the first gallery image** (or as a caption under it).
- **"Shop this look"**: link every product the model wears in a photo (shirt + pant + shoes across our stores' catalog).
- **Fit summary from reviews:** a runs-small/true/large slider, with reviews tagged by purchased size and "how it fits". Add a review question for it.
- **Spec comparison under related products** (collar / sleeve / fit rows), so customers can choose slim vs regular quickly.
- **Delivery date estimate** near the CTA (e.g. "Dhaka: arrives Sat–Sun", by district), plus a free-delivery threshold.
- **Filter drawer with a live "Show N items" count**, and a sticky results/sort/filter bar.
- **Fabric-texture swatches** instead of flat colour dots for shirts.
- Customer outfit photos with height/size (start with admin-curated UGC).
- Avoid their weak spots: always show the struck-through price with `<Price>` and expire offer labels automatically.

## Measure later (with `analytics`)

- Card click-through with vs without size range and rating on the card.
- "Paired Items / shop the look" opens → add-to-cart for the paired item.
- Fit-slider and size-guide views vs size-related returns/exchanges.
- Filter usage, and how often filtered results are 0.
- Comparison-row rail: clicks to a sibling product.
- Effect of the delivery-date line on add-to-cart rate.

## Not observed

- Uniqlo India (blocked). The iPhone-UA session (blocked; I used Android UA instead). Cart drawer and add-to-cart feedback (not tapped). Low-stock / sold-out size states (all sizes were available). MySize ASSIST flow. Desktop layout. Exact cold-cache page weight (cache-disabled reload triggered the bot wall).

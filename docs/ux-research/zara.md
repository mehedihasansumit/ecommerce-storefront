# Zara: mobile UX research (reference for our shirts store, product cards and listings)

- **Site:** https://www.zara.com (US storefront, `/us/en/`)
- **URLs analyzed (reached by following links):**
  - Homepage: `https://www.zara.com/us/en/` (redirects to `/us/`)
  - Listing: `https://www.zara.com/us/en/man-shirts-l737.html` (hamburger menu → MAN → SHIRTS)
  - PDP: `https://www.zara.com/us/en/slim-fit-shirt-p04408147.html` (the "SLIM FIT SHIRT" feature tile on the listing)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, touch on. I used an Android Chrome mobile UA with matching client hints (set through CDP), the same setup that got past Akamai on Uniqlo. **Zara served no bot challenge.**
- **Method:** REA (`inspect_web_page`) plus my own headless Chrome over CDP for scrolling, CDP touch swipes, taps and DOM/`performance` probes. Pop-ups I handled: a OneTrust cookie notice (closed with its X, no choice made), and a **geo modal that detected Bangladesh** ("Yes, stay on United States / No, go to the Bangladesh site"), where I chose "stay". There was also an "Open app" banner. On the first load the hero media stayed empty, and a reload fixed it. I opened the size sheet but **did not pick a size**, because tapping a size adds the item to the cart.
- **REA evidence:** PDP inspect `ev_b228bf15…` (scripts and a11y names). REA kept first-party data only, so third-party and weight figures come from CDP Network events and `performance` entries.

## Homepage

1. **Full-screen editorial slider and nothing else**
   - **Observed:** Each screen is one full-bleed campaign photo or video with a huge logo overlay. Swipe **up/down** moves through slides in a department. Swipe **left/right** switches department (WOMAN / MAN / KIDS / HOME / BEAUTY…). The header is just menu, account, search and bag. No products, prices, categories, badges, trust strip or announcement bar.
   - **Why it grabs attention:** It works like a magazine cover. The brand mood carries the page, and shopping starts in the menu.
   - **How it's built:** `slider-spot` with 9 "universes" (3510px wide track = 9×390, with loop clones). Each universe holds 2 to 9 `slider-spot__slide` items with `<video muted loop playsinline>` backgrounds. The page body is exactly one viewport tall (scrollHeight 844), and the slides are transform-driven, not native scroll.
2. **Visual mega-menu**
   - **Observed:** The hamburger opens department tabs across the top. Under them sits a **swipeable row of photo tiles** (THE NEW, CARGO, SENNA…), then numbered groups ("01 NEW ARRIVALS", "04 COLLECTION" → SHIRTS, "SELECTED ITEMS 40% OFF").
   - **Why it grabs attention:** The photo tiles do the job a homepage category grid would do, inside the menu.

## Listing (Men's Shirts)

1. **Header with sub-category text tabs and a density toggle**
   - **Observed:** VIEW ALL / DRESS SHIRTS / CHECKED / OVERSHIRT… as scrolling text tabs. A grid icon sits next to FILTERS.
2. **Three zoom levels, and the image type changes with density**
   - **Observed:** Zoom 1 (default, editorial) mixes a full-width model hero tile, carousels with a **"2 / 10" position counter** (New Arrivals), a large feature tile (name, price, swatches, "+"), then a **rail of the same shirt in every colour as flat lays ("3 / 5")**. Zoom 2 is a classic 2-column grid of ghost-mannequin packshots with name, price, swatches and "+". Zoom 3 is 3 columns with **packshot + price + "+" only, no names**.
   - **Why it grabs attention:** Browsers get mood, and shoppers who know what they want can scan 9 or more shirts per screen. Flat lays on a neutral background make colour and pattern easy to compare.
   - **How it's built:** The `button[aria-label="Switch to zoom 2. Current zoom 1"]` cycles the levels (it's labelled, which is good). Card images are 2:3 (`194×292`) from `static.zara.net/assets/public/…/07200350700-e1.jpg?ts=…&w=388&f=auto`. `f=auto` negotiates the format, and there's no `srcset`. About 76 tiles load initially.
3. **Card anatomy**
   - **Observed:** A small "NEW" or "NEW / ORIGINS" label, the name in caps (truncated with "…"), the price, **tiny square colour swatches**, and a **"+" quick-add** that opens a size selector (`aria-label="Open size selector"`). No ratings, no discount badges, no wishlist on the card.

## PDP (Slim Fit Shirt)

1. **Vertical stacked gallery in one scroll container**
   - **Observed:** About 11 images (front, back, cuff close-up, layered with a blazer, flat lay…) stacked vertically. The image frames are slightly offset and inset, like magazine pages. There are no dots, counter or swipe. Tapping "Enlarge image" zooms.
   - **Why it grabs attention:** A thumb-scroll shows every angle with no hidden slides, and the editorial framing makes the shirt feel premium.
   - **How it's built:** `.product-detail-card` is the scroller (clientHeight 844, scrollHeight about 7,100). Images are `…-p.jpg?w=1500&f=auto` in 374px slots (oversized), created lazily as you scroll. Each is a labelled `button` ("Enlarge image Zara SLIM FIT SHIRT – White – Image N").
2. **Fixed bottom info sheet that shrinks as you scroll**
   - **Observed:** On load, a bottom panel holds **tabs DESCRIPTION / COLOR / CONTENTS / MEASUREMENTS** (each with a one-line preview), then the name, a **"+4" colour-count button with the current swatch**, the price and an outlined **ADD** button. After scrolling it **shrinks to one row: ADD + price**.
   - **Why it grabs attention:** The CTA never leaves the screen and takes up little space while the photos play. The tabs keep detail one tap away without a long page.
   - **How it's built:** `product-detail-card-info__fixed-info-panel` is `position: fixed` (top≈710, 134px tall at first).
3. **ADD opens a size sheet, and tapping a size adds the item**
   - **Observed:** The gallery stays visible above a list S / M / L / XL plus a **"SIZE RECOMMENDER"** link. There's no separate "add" step after choosing the size.
   - **How it's built:** Each size `li` carries `data-qa-action="size-in-stock"`, so stock state is encoded per size (all four were in stock here). The recommender loads from an in-house adapter (`prosinecki-static/adapters/sastre.js`).
4. **Service links under the gallery:** "Check in-store availability", "Shipping, exchanges and returns" (accordions), and "How can we help you?".
5. **"Complete your look" with quick-add**
   - **Observed:** Packshots of a blazer, shoes and a belt with price and "+". Then a long **"You might like"** grid (over 30 items).
   - **How it's built:** An in-house recommender bundle (`recommender-in-house…js`, ~580 KB). There's also a 2.4 MB `recom-chat-alma.js` (AI chat recommendation module) on the PDP.
6. **No reviews, ratings, model height or size info, delivery date or badges** on the PDP.

## How it's built (summary)

- Inditex in-house SSR + client app (`stdstatic/10.12.0`), `zds-*` design-system classes, self-hosted **Helvetica Now Text** (normal and condensed, 300–700, WOFF2).
- Akamai sensor (`/akam/13/…`) and **Jscrambler** integrity script, Riskified, Apple Pay SDK.
- Third parties on the PDP (CDP Network, warm cache, 15 s with scrolling): **213 requests**, including Google (GTM/Ads/Analytics), TikTok, Meta, Naver, Attentive, Awin, `event-tracker.inditex.com`. Homepage `performance`: 74 requests / ~1.7 MB on first load (before slide media).
- JSON-LD `ProductGroup` (variants by colour/size).

## Weak spots

- **No products or prices on the homepage.** The first product needs menu → tab → category, and the first product view is 3 or more taps in. That suits Zara's brand pull but not a store people don't know yet.
- Truncated names ("EMBROIDERED TEXT BOX…") and 3-column tiles without names make products harder to tell apart.
- **No social proof anywhere** (no reviews, ratings or fit info), and no model height/size.
- Swatches about 8px square, and thin outlined ADD: small, low-contrast touch targets.
- 1500px images in 374px slots. The hero media was empty on the first headless load. A 2.4 MB chat bundle on the PDP.
- One-tap-adds-to-cart on the size sheet risks wrong-size adds and gives no review step.
- The geo modal and cookie notice show up before any content (for us, a BD visitor gets redirected, which is helpful).

## Takeaways for our shirts store

- **Grid density toggle on listings** (1 editorial / 2 / 3 columns), with flat-lay packshots at higher densities. Remember the choice per viewer.
- **"Same shirt in every colour" rail**: a horizontal flat-lay strip of each colourway on the listing or PDP, with an "n / N" counter.
- **Vertical stacked PDP gallery** as an option for shirts: front, back, collar/cuff close-up, worn under a blazer, flat lay. No hidden slides.
- **Collapsing sticky bottom panel:** full info (name, colour count, price, CTA) at first, shrinking to "Add · price" while scrolling.
- **Tabbed info sheet** (Description / Colour / Fabric / Measurements) instead of long accordions.
- **"+" quick-add on listing and "Complete the look" cards** that opens a size sheet (but keep an explicit confirm, and show low-stock per size).
- **Visual menu:** photo tiles at the top of the mobile menu for top categories and campaigns.
- Geo-detect the visitor and offer the right store (useful for us across domains).
- Don't copy the product-free homepage. We need products on the first screen.

## Measure later (with `analytics`)

- Listing density choice: share of viewers who switch, and click-through/add-to-cart per density.
- Colourway rail: taps per colour, and colour diversity in orders.
- Quick-add from listing / "Complete the look" vs PDP add, plus the wrong-size return rate.
- Collapsing sticky panel vs a standard sticky ATC: ATC rate and scroll depth.
- Gallery depth: how many images get viewed (vertical stack vs swipe carousel).

## Not observed

- Low-stock / "coming soon" / sold-out size states (all sizes in stock). The size recommender flow. Cart feedback after adding (avoided on purpose). The AI chat module UI. Video playback (empty on first load). The Bangladesh storefront (declined in the geo modal). Cold-cache page weight. Desktop layout.

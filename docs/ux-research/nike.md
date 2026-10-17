# Nike: mobile UX research (reference for our shoes store)

- **Site:** https://www.nike.com (US storefront; no geo-redirect from a BD IP, but a location picker opened)
- **URLs analyzed:**
  - Homepage: `https://www.nike.com/`
  - Path to the PDP: hamburger menu, then Men (`/men`), then the "Shoes" link (`/w/mens-shoes-nik1zy7ok`), then the 3rd card.
  - PDP: `https://www.nike.com/t/air-force-1-07-mens-shoes-XVPIszaq/IV6306-010` (Air Force 1 '07, $125)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px (CDP device-metrics override, mobile, DPR 3), iPhone iOS 18 Safari UA, touch enabled
- **Method:** REA (`capture_web_screenshot`) plus my own headless Chrome over CDP for scrolling, DOM/`performance` probes and screenshots. **No bot challenge was served.** A full-screen "Select your Location" modal appeared on the homepage and again on the PDP; I closed it with its "Close Pop Up" button both times, without choosing a region. A bottom "Only in the Nike App" smart banner stayed on screen and I left it alone. On the PDP I tapped "Add to Bag" **without a size** to see the validation; nothing was added.
- **REA evidence:** homepage screenshot `ev_5dce0bbb…` (it shows the location modal), PDP screenshot `ev_a217420d…` (taken after I closed the modal). REA keeps only same-origin data, so third-party hosts and weight come from CDP `performance.getEntriesByType('resource')`.

## Homepage

1. **Top-of-page interruptions**
   - **Observed:** On first load, a full-screen region picker covers everything. After I closed it, a sticky bottom app-install banner took about 85px.
   - **Why it matters:** This is the opposite of grabbing attention. It is listed under Weak spots.
2. **Full-bleed campaign hero with one pill CTA**
   - **Observed:** A tall sports photo (about 580px), a heavy condensed uppercase headline bottom-left, a one-line subhead and a single white pill button. There is no announcement bar on the homepage (the free-shipping bar only appears on the PDP).
   - **How it's built:** No `<video>` on mobile. Images come from `static.nike.com/a/images/f_auto/dpr_3.0,…/h_584,c_limit/…`, a transform URL that negotiates format (`f_auto`) and bakes in the DPR, so there is no `srcset`.
3. **A product rail directly under every campaign**
   - **Observed:** Right below the hero (at about 650px, within the first screen) is a swipeable rail of large grey-background packshots, about 1.2 cards visible. **The cards show only the image: no name and no price.** The same "campaign block, then product rail" pairing repeats down the page (a basketball shoe launch, NFL, a retro-running story, city running-crew quotes, NBA, Men/Women/Kids tiles, a cold-weather gear story, "Trending").
   - **Why it grabs attention:** Every story ends in something you can buy within one swipe, so the shop is never more than a thumb away.
   - **How it's built:** A CSS scroll-snap slider (`scroll-snap-type: x mandatory`). Each card is a bare `<a>` with `aria-label=" "`.
4. **Partner and sub-brand logo lockups as section dividers**
   - **Observed:** Each block opens with a small centred logo pair (league + brand, or the sub-brand mark) above the image.
   - **Why it grabs attention:** It labels the section's audience in about 60px, without a text heading.
5. **Sticky header that hides on scroll down and returns on scroll up**
   - **Observed:** The header (logo, AI-sparkle search, account, bag, menu) slides away while scrolling down.
   - **How it's built:** `header.is-fixed.is-hidden` with `top:-60px` (computed style).
6. **Search with an AI entry point**
   - **Observed:** A sparkle on the search icon. The search panel includes "Ask Nike AI" plus popular search terms (`data-testid=ask-nikeai-search-result`, `popular-search-terms`).

## PDP

1. **Free-shipping bar, then title and price above the gallery**
   - **Observed:** A grey member bar ("Free shipping on orders over a threshold"), then the name, "Men's Shoes" subtitle and price, all above the image. (Price above the gallery is already known from Allbirds.)
2. **A "Highly Rated" badge on the first image**
   - **Observed:** A white pill with a star and "Highly Rated" sits top-left on the gallery.
   - **Why it grabs attention:** Social proof is carried by the hero image itself. One glance says "others love this" without a review count to parse.
   - **How it's built:** `data-testid=mobile-image-carousel-highly-rated-badge`. It is backed by JSON-LD `ProductGroup` with `AggregateRating` 4.9 / 1,344 reviews, so the badge appears only above a rating threshold.
3. **Swipe gallery with a pill indicator**
   - **Observed:** 8 images on a light grey background. The indicator is a short dash for the active slide and small dots for the others. There is no video or 360 view.
   - **How it's built:** A native scroll-snap list (`mobile-image-carousel-list`, 8 items, `x mandatory`), with no carousel library. The images use a `t_web_pdp_936_v2` transform.
4. **Colourway picker made of photo tiles**
   - **Observed:** Below the gallery is a horizontal row of square **product-photo thumbnails, one per colourway (18), plus a "design your own" tile**, with a scroll progress bar.
   - **Why it grabs attention:** A real thumbnail of each colourway is far easier to judge than a colour dot, especially for two-tone shoes.
   - **How it's built:** `colorway-link-<styleColor>`. Each colourway is its own URL/style code, so every colour gets its own page and its own SEO.
5. **Two-column size grid with dual M/W labels**
   - **Observed:** "Select Size" plus a "Size Guide" link, then a 2-column grid of wide buttons labelled "M 9 / W 10.5". Sold-out sizes are grey and struck through.
   - **How it's built:** Visually hidden `input[type=radio]` with styled labels (`pdp-grid-selector`). The size guide links to a separate page, `/size-fit/mens-footwear`.
6. **Instalment line between size and CTA**
   - **Observed:** "From $X/month, or 4 interest-free payments" with the BNPL provider's name and a "check purchase power" link, right above the button.
   - **Why it grabs attention:** It reframes the price as a small monthly amount exactly when the customer is deciding.
   - **How it's built:** The Klarna on-site messaging script (`js.klarna.com`, `data-testid=klarna-pdp`).
7. **CTA that stays "Add to Bag" and points at the problem**
   - **Observed:** The big black "Add to Bag" and an outlined "Favorite ♡" are always active. Tapping Add to Bag with no size **scrolls the size grid into view, outlines it in red, turns "Select Size" red and shows "Please select a size."** below it.
   - **Why it grabs attention:** The button never looks disabled, so it always invites a tap, and the error takes the user straight to the fix. This is an alternative to the "Select a size" disabled state we already know.
   - **How it's built:** A floating copy (`atb-button-floating`, a 62px full-width fixed bar) appears once the inline button scrolls off.
8. **Delivery and pickup right under the CTA**
   - **Observed:** "Shipping: options shown at checkout", then "Free Pickup" with a "Find a Store" link.
9. **Short description, then progressive detail**
   - **Observed:** One paragraph, two bullets (colour shown, style code), then "View Product Details", which opens a modal with Benefits and Product Details lists. Then accordions for "Shipping & Returns" and **"Reviews (1344) ★★★★★"**. The stars sit in the accordion header, so the score shows while it is collapsed.
   - **Observed (reviews):** Expanded, it shows "4.9 Stars" and the three most recent reviews, **including a 2-star one**, each with title, stars, a handle/date and a "More" clamp, then "See Reviews" and "Write a Review".
   - **How it's built:** TurnTo (`widgets.turnto.com`).
10. **"How Others Are Wearing It" UGC block**
    - **Observed:** A heading, a prompt to upload a photo or tag the brand, and an "Upload Your Photo" button. The gallery itself stayed blank in headless.
    - **How it's built:** Pixlee (`photos.pixlee.co`).
11. **"Complete the Look": a shoppable outfit card**
    - **Observed:** A carousel of flat-lay outfits (hoodie, joggers, socks, plus *this* shoe) with **round hotspots on each item** and an eye icon to view the set.
    - **Why it grabs attention:** It sells the shoe in an outfit and makes the add-on items tappable, so one photo cross-sells several categories.
    - **How it's built:** Stylitics (`styliticsWidget`, `stylitics-nike-outfit-card`).
12. **"You Might Also Like"**: a rail of large cards. They were still grey skeletons in my captures.

### How it's built (both pages)

- **Platform:** Next.js (`__NEXT_DATA__` present) and React, with Nike's own design system (`nds-btn`, `ncss-btn-*`) and CSS-in-JS class names. Components carry `data-testid` hooks.
- **Carousels:** native CSS scroll-snap, with no Swiper or Slick.
- **Images:** `static.nike.com` transform CDN with `f_auto` and a `dpr_3.0` parameter. There is no `srcset`/`<picture>`. 100 of the 106 homepage images are `loading="lazy"`.
- **Fonts:** Nike Futura ND (condensed headlines) and Helvetica Now Text/Display.
- **Third parties:** GTM/GA, Google/DoubleClick, Meta, TikTok, Pinterest, Snap, Reddit, Bing, Amazon Ads, The Trade Desk, Singular, an OpenAI-hosted script (`bzrcdn.openai.com`), New Relic, Akamai mPulse, Salesforce chat, Klarna, TurnTo, Pixlee and Stylitics.
- **Weight (CDP `performance`):** homepage 250 requests / ~3.8 MB transferred, DOMContentLoaded 2.1 s. PDP 250 requests / ~0.8 MB (warm cache), DOMContentLoaded 2.5 s, load 8.0 s. The PDP has 3,665 DOM elements.

## Weak spots (anti-patterns)

- **A full-screen location modal on every page load** (it reappeared on the PDP), plus a permanent app-install banner. That is two interruptions before any product.
- **Homepage product cards have no name or price, and an empty `aria-label`.** That is bad for scanning and for screen readers.
- **Images use `dpr_3.0` for every device**, so mid-range phones download 3× pixels.
- **Shipping cost is deferred to checkout** ("see options at checkout"), which is a classic source of cart abandonment.
- **Reviews are collapsed** by default. The stars are visible but the content is hidden.
- About 30 third-party ad and analytics hosts.

## Takeaways for our shoes store

- **"Highly rated" / "Bestseller" badge on the first gallery image**, shown only when the rating is ≥4.5 with at least N reviews (computed from our `reviews` feature).
- **Colourway picker made of product-photo thumbnails** instead of colour dots, with each colour on its own URL for SEO.
- **Always-active CTA with guided validation:** tap without a size, then scroll to the size grid, outline it in red and show an inline `<Field error>` message. Run it as an A/B test against the "Select a size" state.
- **Pay-later line above the CTA**, e.g. "Pay ৳X now, the rest on delivery" or EMI/bKash instalments where available, using `<Price>`.
- **"Complete the look" outfit card with hotspots:** pair shoes with the apparel and accessories (socks, belts) *that the same store sells*, so a single image cross-sells several items. Showing another tenant's punjabi or shirts would break `storeId` isolation unless that is designed explicitly.
- **Star rating in the reviews accordion header**, and show the most recent reviews, negative ones included, because honesty builds trust.
- **"Campaign, then product rail" pairing:** every homepage banner is followed by a swipeable rail of its products, so the first product appears within the first screen.
- **Hide-on-scroll sticky header** to give the gallery more room on small phones.
- **Show delivery cost near the CTA** (where Nike doesn't) and never interrupt the first visit with a modal.
- Technical: native scroll-snap carousels (no library), plus `next/image` with real `sizes` instead of a fixed DPR.

## Measure later (with `analytics`)

- Add-to-cart rate with vs without the "highly rated" gallery badge.
- Size-validation flow: taps on Add to Bag with no size, and how many of those reach add-to-cart after the scroll-to-size prompt (compare with the disabled "Select a size" variant).
- Colourway thumbnail taps vs colour-dot taps, and the share of sessions that view at least 2 colourways.
- Hotspot taps on "Complete the look" and the attach rate (orders with a shoe plus an apparel item).
- Clicks on the pay-later/COD line and the conversion it brings.
- Homepage: scroll depth to the first product rail, and rail impression to click by position.

## Not observed

- No video or 360 view on this PDP. The "You Might Also Like" cards and the Pixlee UGC gallery didn't finish rendering in headless.
- The size guide page content (it is a separate page I didn't follow), a width option (none offered for this shoe), store stock levels, and the cart/checkout.
- The BD regional Nike experience: I didn't choose a region in the location picker.

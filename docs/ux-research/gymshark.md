# Gymshark: mobile UX teardown

- **Site:** Gymshark (UK DTC activewear brand), https://www.gymshark.com (the US storefront was served by default)
- **URLs analyzed:**
  - Homepage: `https://www.gymshark.com/`
  - Collection used to reach the PDP: `https://www.gymshark.com/collections/t-shirts-tops/mens` (the "T-Shirts & Tops" link under Men in the header menu)
  - PDP: `https://www.gymshark.com/products/gymshark-power-t-shirt-ss-tops-black-aw25-3` (Power T-Shirt, Black/Conditioning Red, #1 in the collection's "Top 10")
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 at DPR 2, mobile and touch emulation through CDP, iPhone iOS 18 Safari UA
- **Method:** REA (`capture_web_screenshot`, `inspect_web_page`) plus my own headless Chrome on port 9230, driven by CDP scripts that scroll, tap and read the DOM. The site clears its resource-timing buffer, so I measured page weight with a CDP `Network` capture (cache disabled, 15–18s after reload). REA's inspection stays on the site's origin, so third-party hosts come from that capture.
- **Pop-ups dismissed:** a OneTrust cookie sheet ("Continue To Website"), and a geo sheet ("Are you in the right place? ROW / US") that I closed with its ×.

REA evidence: PDP screenshot `ev_9e5326aea8608df7ae0…`, PDP inspect `ev_4fc3f25a8ad1375fe8c…`.

**Platform:** **Headless Shopify behind a custom Next.js front end** (Pages Router: `__NEXT_DATA__.page` = `/products/[productSlug]`, chunks under `/_next/static/`, CSS-module class names such as `add-to-cart_button-container__bHRuV`). Product images come from `cdn.shopify.com` (`_828x` widths, a 14-entry `srcset`, `sizes="100vw"`). The browser was served **JPEG XL (19), WebP (47) and AVIF** by content negotiation. Editorial images come from Contentful (`images.ctfassets.net`) through `/_next/image`. Gallery: a native **CSS `scroll-snap-type: x mandatory`** strip, no carousel library. Fonts: custom "SN Skandia" and "Plaak Gymshark" plus an icon font. Search: Algolia. Personalisation: Dynamic Yield. Chat: Intercom. RUM: Datadog. Consent: OneTrust. Bot protection: AWS WAF.

---

## Homepage

1. **Red rotating promo bar with a pause button**
   - **Observed:** One line at a time: free shipping over $75, students 12% off, $10 referral, 15% off for email sign-up. There is a ❚❚ button on the right.
   - **Why it grabs attention:** The bright colour is the only saturated element above a dark hero. The pause control makes the rotation accessible, which Yellow's ticker lacked.
   - **How it's built:** A slide list with a "Pause slide rotation" button (accessibility text).

2. **Minimal transparent header over a full-bleed hero**: hamburger and search on the left, a wordmark, account and bag on the right. The athlete-campaign hero fills the whole first screen with a single "TELL ME MORE" button. The header hides as you scroll down and comes back when you scroll up (`header_wrapper-container`, fixed, moved to top −172px).

3. **No prices on the homepage**
   - **Observed:** The page is ~7,800px of editorial blocks: "Featured collections" (2-col tiles, one tagged **"COMING SOON"**), full-width Women's / Men's "Shop now" panels, **"Popular right now" with Women/Men toggle chips** controlling a tile grid, "How do you train?" (Lifting / HIIT / Running / Pilates), then guides. The only "$" amounts are in the promo bar.
   - **Why it matters:** As with Yellow, it is a brand router. Gymshark can afford that because buyers know the brand. A newer store can't.

4. **Shop by activity, not by garment**: "How do you train?" sorts products by the reason people buy them. Our equivalent would be by occasion.

### Collection page (on the way to the PDP)
- **A numbered "Top 10 in category" rail sits at the top of the collection**: square tiles with a big **1, 2, 3…** in the corner, then name and price. Some tiles have an editorial eyebrow ("made for lifting", "the essentials", "all day comfort").
- A sticky **Sort · "432 products" · Filter** bar.
- Grid cards: a tall 4:5 photo with a **quick-add bag icon** (top-left) and wishlist (top-right), then "★ 3.9", name, fit ("Oversized Fit"), colour name and price.
- The page layout is 398px wide in a 390px viewport (horizontal overflow, measured as `innerWidth`).

---

## PDP

1. **Live view counter laid over the gallery**
   - **Observed:** A white pill near the bottom of the first image: "🔥 3.4k people viewed this in the last 24 hours".
   - **Why it grabs attention:** Social proof right in the photo, before the title, and a real number about demand.
   - **How it's built:** `div.social-proofing_container`, filled from Gymshark's own service `engagement-counter.product-engineering.gymsharkapps.io` (4 requests in the network capture).

2. **Gallery: native scroll-snap, 4:5, 8 images including an annotated "feature callout" shot** (file name `ANNOTATED_PDP_…`). Every image has a "Zoom on image" button.

3. **Compact buy box: title, fit line, then price on the left with rating on the right**
   - **Observed:** "POWER T-SHIRT", then a muted "Oversized Fit", then **$36** on the left and **★3.9 (167)** on the right, all on the same row.
   - **Why it grabs attention:** The price and the rating are on one line, and the *fit type* gets its own line right under the title.

4. **CTA pinned to the bottom of the first screen until the real button scrolls in**
   - **Observed:** On load, "Add to bag" plus a wishlist heart float at the bottom of the screen *over the product info*. Once the inline buy box arrives, the bar settles into place and doesn't follow you further down (no sticky bar at y=2100).
   - **Why it matters:** The CTA is always on the first screen, without a bar covering the reviews and description later. This is a different trade-off from Allbirds' always-on sticky bar.
   - **How it's built:** `div.add-to-cart_button-container` with `position: sticky` (bottom) inside the buy-box container, so the stickiness ends with its parent. No JS observer needed.

5. **Colour as a 12-photo grid of the garment itself, plus a colour name and "Show more colours"**. Each swatch is a small product photo, not a colour dot.

6. **Size grid with a crowd-sourced fit verdict**
   - **Observed:** A 4-column grid of square size cells (XS–3XL); the selected cell turns solid black. Under the grid: **"✓ Customers say it fits *true to size*"**, linked to the reviews. "Size Guide" is a right-aligned link.
   - **Why it grabs attention:** Customers answer the fit question, right where the size is picked.
   - **How it's built:** `<fieldset>` + `<label>` radios (`add-to-cart_sizes--grid`). Cells are about 85×50px, so the touch targets are generous.

7. **Payment and perks stacked under the CTA**: "Pay in 4 interest-free payments of $9.00" (PayPal), the Klarna / Afterpay / Sezzle logos, then a bordered box with **loyalty XP earned ("earns 288XP")**, "Free Standard Delivery over $75" and "Express Delivery Available".

8. **"Get The Look" card**: a bordered card with 2 thumbnails ("2 Products") right under the perks, plus a full "GET THE LOOK" rail further down with quick-add icons. This is a complete-the-outfit cross-sell placed early.

9. **Delivery & Returns and Share open bottom sheets** (`sheet_sheet` components). Below that, **tabs: Designed For · Description · Features**, starting with a one-sentence "designed for" pitch and an icon-led feature list.

10. **Reviews built for apparel**
    - **Observed:** "3.9 · Based on 167 reviews", **"84% of customers would recommend this"**, a 5→1 star histogram, **slider bars for Comfort and Quality**, a search box ("Search reviews and topics"), and filters for **Rating, Activity, Age, Workout Frequency, Height**. Reviews have a headline, "Verified buyer" and helpful votes, paged with "Load More".
    - **Why it grabs attention:** Shoppers can find reviews from people their size, and the recommend-percentage reads better than 3.9★ on its own.
    - **How it's built:** In-house component (an untranslated `reviews.search_label` key leaks into the page text). It loaded fine headless.

**Weight (cache disabled):** homepage ≈202 requests and **≈6.8MB** (3.7MB JS, 2.6MB images). PDP ≈229 requests and **≈6.3MB** (3.6MB JS, 2.1MB images). Third-party hosts: Datadog, Google (GTM, Ads, DoubleClick), Pinterest, TikTok, Meta, Bing, Reddit, Amazon Ads, AppLovin, The Trade Desk, mParticle, Dynamic Yield, Intercom, OneTrust and AWS WAF.

---

## Weak spots (anti-patterns)

- **3.6MB of JavaScript** and about 15 ad and tracking vendors. On BD mobile data, our pages shouldn't come anywhere close.
- **The gallery images, including the first one, use `loading="lazy"` and `fetchpriority="auto"`.** Preload links partly make up for it, but it's a bad LCP pattern to copy.
- **No price on the homepage**, and a hero that's all brand image.
- Two modal sheets (cookie, geo) on first load cover the hero.
- The collection page overflows horizontally (398px in a 390px viewport).
- The view counter ("3.4k viewed") is fine when it's real, but the same widget is easy to fake, and BD shoppers are wary of fake popups. Use it only with honest numbers.
- An untranslated i18n key shows in the reviews UI.

## Takeaways for our stores

- **"Customers say it fits true to size" line under the size picker**, worked out from a fit question in our reviews (small / true / large). Shirts and shoes, where fit is the biggest reason for exchanges.
- **Fit-type line under the title** ("Slim fit", "Regular fit", "Long panjabi, 44 in"). Shirts and punjabi.
- **CTA sticky within the buy box only** as a lighter alternative to a full sticky bar. Worth prototyping both against each other. All stores.
- **Numbered "Top 10" / best-seller rail** at the top of a category page (big rank numbers). All stores, and especially good for shoes and shirts.
- **Photo swatches** (the garment in each colour) instead of colour dots. Punjabi and shirts, where the embroidery and print matter more than the base colour.
- **"Complete the look" card right under the CTA**: punjabi + pajama + nagra, or shirt + chinos.
- **Review summary with "% would recommend" plus Comfort / Quality bars**, and a **height filter** for punjabi length. All stores, once review volume allows.
- **Shop by occasion** on the homepage (Eid, wedding, office, casual) instead of by garment. Punjabi first.
- **Pause control** on any rotating announcement bar (a11y).
- Use **native CSS scroll-snap** for galleries and rails instead of a carousel library, but load the first image eagerly with `fetchpriority="high"`.

## Measure later (analytics feature)

- Fit-verdict line: size-selection → add-to-cart rate, and size-related exchanges.
- Buy-box-sticky vs. always-on sticky CTA: add-to-cart rate and reviews reach.
- Top 10 rail: clicks per impression vs. clicks on the first row of the grid.
- Photo swatches vs. dots: colour-switch rate and add-to-cart rate.
- Complete-the-look: attach rate (orders with 2+ items from the look).
- Review filters / % recommend: review-section engagement and PDP conversion for sessions that open reviews.
- Occasion tiles on the homepage: homepage → PDP click-through.

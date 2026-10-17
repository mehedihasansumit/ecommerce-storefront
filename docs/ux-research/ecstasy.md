# Ecstasy: mobile UX teardown

- **Site:** Ecstasy (Bangladeshi menswear and womenswear brand), https://www.ecstasybd.com
- **URLs analyzed:**
  - Homepage: `https://www.ecstasybd.com/`
  - Collection (used to reach the PDP): `https://www.ecstasybd.com/?page=product-list&sid=4` (hamburger menu > MAN > Shirt)
  - PDP: `https://www.ecstasybd.com/?page=product-details&pid=7526` ("Casual Shirt", the first card in that listing)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 at DPR 2, mobile + touch emulation (CDP `Emulation.setDeviceMetricsOverride`, held by a background CDP session), iPhone iOS 18 Safari UA
- **Method:** REA (`inspect_web_page` with accessibility text, `capture_web_screenshot`) plus my own headless Chrome on port 9227, driven by small CDP scripts that scrolled the page, opened the menu, followed links, and read the DOM and `performance`. REA scopes its inspection to the site's own origin, so I took third-party hosts and page weight from `performance.getEntriesByType("resource")`. **I closed a full-screen promo pop-up** (a "Puja special 12% off" image) before taking the clean screenshots.

REA evidence IDs: homepage screenshots `ev_2153adff…` (with pop-up), `ev_2d358fcd…` (above the fold), `ev_7c6b5abb…` (product rail), `ev_b1370e6d…` (category tiles), `ev_1da71874…` (menu); homepage inspect `ev_9b2029a0…`; collection `ev_dcca2a30…`; PDP `ev_88a56a31…` (gallery), `ev_c795b6fd…` (price/info), `ev_4c85256e…` (fit note), `ev_08c154c0…` (CTA/related); PDP inspect `ev_493ae5f0…`.

**Platform:** A custom PHP storefront built from a bought HTML template (query-string routing like `?page=product-details&pid=`, Bootstrap, the footer credits an agency). It uses jQuery 3.5.1 from Google's CDN (with 3.3.1 also present), **Slick** for the hero and PDP gallery, **Splide 4.1.4** for the product rail, a jQuery zoom plugin, select2, SweetAlert and jquery-cookie. The font is Roboto 300–700 from Google Fonts. Images are served as-is from the site's own nginx (`/all-images/product/*.jpg`): no CDN, no WebP, no `srcset`, and no `loading="lazy"` (0 of 51 homepage images are lazy).

---

## Homepage

1. **Full-screen promo pop-up on load**
   - **Observed:** A full-viewport overlay with a festival-discount image and a × button, shown on first load and again on the listing and PDP.
   - **Why it grabs attention:** It announces the sale, but it covers the first product completely.
   - **How it's built:** `.pop-up-container` set to `z-index: 2147483647`. It is a single `<img>` inside a link to `/`, so the offer text is not real text.

2. **Plain header, sticky only after you scroll**
   - **Observed:** The logo on the left, a cart icon with a red count badge, and a hamburger. There is no announcement bar and no search icon in the header (search sits inside the menu).
   - **How it's built:** `.header-main-area.sticky` gets `is-sticky` on scroll.

3. **Hero carousel with a white pill CTA (~370px)**
   - **Observed:** 3 slides (Men's SS26, Women's SS26, a celebrity sub-line). Each slide has a large thin title and a white "SHOP NOW" pill.
   - **Why it grabs attention:** Unlike Yellow, every slide has a visible CTA. The title also says *who* the slide is for (men or women).
   - **How it's built:** Slick, `autoplay: true`, 3000ms. The slides are CSS `background-image`s (PNG/JPG, **1.2–1.9 MB each**), so there is no responsive image and no alt text.

4. **"New Arrival" centre-mode product rail right under the hero**
   - **Observed:** The first product card starts at about y=540, so its top half is visible on the first screen. One card is centred with neighbours peeking in on both sides. Each card has a black "-12%" badge, an uppercase name, `TK.1851` and the old price struck through in red.
   - **Why it grabs attention:** The peeking neighbours tell you to swipe. Price and discount are on the first scroll.
   - **How it's built:** Splide `type: 'loop'`, `focus: 'center'`, `autoplay: true`, `interval: 4000`, `padding: '15%'` below 640px (from the inline config). The cards have a `pri-img`/`sec-img` pair for a hover swap that can't be used on touch.

5. **Celebrity line banner, then a 2×2 department grid plus full-width banners**
   - **Observed:** A campaign image with a "Shop Now" button, then MEN / WOMEN / LIFESTYLE / sister-brand tiles (190×270), then two full-width "New Arrival" image banners.
   - **How it's built:** Plain `<img>` inside links. The sister-brand tile goes to a different domain.

6. **Footer with real contact routes**
   - **Observed:** Phone, email and a **WhatsApp number**, policy links ("Shipping & Exchange Policy") and one payment-methods image. A circular back-to-top button stays fixed at the bottom left.

**Weight:** 75 requests. Decoded resources total **about 30 MB** (transfer size was hidden by cache and cross-origin limits). The heaviest images are the hero slides at 1.2–1.9 MB and the 1875px product JPGs. DOMContentLoaded 0.84s, load 1.25s on a warm cache. Third parties: GA4 (two properties) plus legacy UA, Meta pixel, Google Ads, cdnjs and Google Fonts.

### Collection card anatomy (seen on the way to the PDP)
- A **single-column** list: each card is 360px wide and about 573px tall, so roughly 1.3 products fit per screen. Breadcrumb "MAN / Shirt" and a "view: 1 / 24" counter. Every product is named "CASUAL SHIRT" or "PREMIUM CASUAL SHIRT", so the names don't tell the products apart.

---

## PDP

1. **Gallery with the size chart as one of the slides**
   - **Observed:** A large square-framed photo (about 500px) with a 3-up thumbnail strip below it. **The first thumbnail is the size chart** (an image), sitting next to the model shots. There are 4 images in all (3 photos plus the chart).
   - **Why it grabs attention:** The size chart is one swipe away, at the moment the shopper is looking at fit.
   - **How it's built:** Slick `product-large-slider` plus a `pro-nav` thumbnail slider, with jQuery zoom (`.zoomImg`). The full images are 1875px JPEGs, and the chart is a PNG.

2. **Breadcrumb, then title, then price with no % badge**
   - **Observed:** "MAN / Shirt / Casual / CASUAL SHIRT", then the title, then `TK. 1938` big and bold with `TK. 2202` struck through in grey. The "-12%" shown on the cards is missing here.

3. **Fabric care and a detailed model-fit block before the size picker**
   - **Observed:** "Fabric: 100% cotton", care steps, then *"model usually wears L top / 32 waist, wearing L, fits true to size"* with the model's height, chest and waist in inches and cm. After that come a one-row spec table (Sizes: S, M, L, XL), green "Availability: In Stock", SKU and an internal PID.
   - **Why it grabs attention:** **Chest and waist measurements, not just height**, let a shopper compare against their own body. "Fits true to size" is the reassurance people want before ordering online.
   - **How it's built:** Static HTML in an "INFO GUIDE" tab. The "description" and "reviews" tabs are hidden.

4. **Size as a native `<select>` collapsed into an accordion-style row**
   - **Observed:** A "SIZE ⌄" row, then a qty stepper next to a dark "ADD TO CART" button. The CTA sits at about y=1610, two full screens down.
   - **How it's built:** `<select class="productSize">` with no disabled options, so sold-out sizes are not shown. There is no "Buy now".

5. **Related products: a single-card carousel**
   - **How it's built:** Slick, with only 2 items.

6. **Missing near the CTA:** delivery time or charge, COD, returns, WhatsApp order and stock count (keyword scan of the PDP: 0 for "delivery", "COD", "Dhaka", "bKash"). There is no sticky add-to-cart and no JSON-LD, and every page has the same `<title>` ("Ecstasy BD") and og:title.

---

## Weak spots (anti-patterns)

- **Leftover template content is in the live DOM.** The off-canvas menu contains placeholder contact details ("0123456789", a "yourdomain" email), and the hidden reviews tab holds a lorem-ipsum review from 2019 on a placeholder product name. If those tabs are ever shown, trust is gone.
- **The pop-up covers the first product on every page view**, and its offer is an image, so it can't be read as text or translated.
- **No lazy loading, no `srcset`, no WebP:** about 30 MB decoded on the homepage, which is painful on Bangladeshi mobile data.
- **The CTA is two screens below the gallery**, and there is no sticky bar.
- **Generic, repeated product names** and a single-column listing make it hard to compare products.
- The discount badge shows on cards but disappears on the PDP. The site title is the same everywhere (bad for SEO and for browser tabs).
- The fixed back-to-top button overlaps the qty stepper.

## Takeaways for our shirts store

- **Make the size chart a gallery slide** (or a pinned last slide) for apparel, in addition to the accordion. It sits where the shopper is already looking at fit.
- **Model-fit block with body measurements** (height, chest, waist, size worn, "fits true to size / runs small"). Store it as structured product fields so it can be translated, not as free text.
- **Centre-focused product rail with peeking neighbours** right under the hero, so the first price shows on the first screen.
- **Name the audience on each hero slide** and always include a CTA.
- Keep the discount badge the same on the card and the PDP.
- Do the opposite of their image pipeline: our `sharp` + RustFS route should always produce responsive WebP/AVIF with lazy loading below the fold.

## Measure later (with `analytics`)

- How many gallery swipes reach the size-chart slide, and add-to-cart rate for sessions that saw it vs. those that didn't.
- Size-related returns or exchanges for products with vs. without a model-fit block.
- Rail swipe depth and click-through rate for a centre-mode rail vs. a 2-up grid.
- Bounce rate when a promo pop-up is shown vs. a non-blocking banner.

*Not observed:* reviews (the tab is hidden), checkout and delivery charges (out of scope), the cart drawer contents, and any Bangla version (the site is English only, `lang="zxx"`).

# Aarong: mobile UX research

- **Site:** Aarong (reference for the punjabi / ethnic store and Bangladeshi customer expectations)
- **URLs analyzed:**
  - Homepage: `https://www.aarong.com/` (redirects to a country gate at `/bgd/landing-page`; the analyzed homepage is `https://www.aarong.com/bgd`)
  - PDP: `https://www.aarong.com/bgd/magenta-aari-embroidered-endi-silk-panjabi.html`, reached by following homepage "Men" tile → `/bgd/men` → first panjabi product link
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, mobile + touch emulation, iPhone iOS 18 Safari UA
- **Method:** REA (`inspect_web_page`, `capture_web_screenshot`) on own headless Chrome (CDP :9223), scrolling and tapping driven via CDP `Runtime.evaluate` / `Input.dispatchMouseEvent`, plus DOM and `performance` resource-timing queries
- **REA evidence:** homepage inspect `ev_c43f3fa3…fe4ff8`, homepage screenshot `ev_d7ebb6a1…dcf5b6d`, PDP inspect `ev_90e9e6b8…55b4e7`, PDP screenshot `ev_12e522d4…bc08`. REA filtered third-party origins (status `policy_filtered`), so third-party script facts come from DOM/resource-timing queries.

## Homepage

1. **Country gate before the store**
   - **Observed:** The first visit lands on a "select delivery location" page (Bangladesh plus 7 countries, then GO). After that, every path is prefixed `/bgd/`.
   - **Why it grabs attention:** It doesn't. It sets currency and shipping up front for a diaspora audience, but it adds a tap before any product shows.
   - **How it's built:** Next.js App Router with a `[country]` dynamic segment. Chunks `app/[country]/layout-*.js` and `app/[country]/page-*.js` appear in REA's script inventory (`ev_c43f3fa3…`).

2. **Two-tier sticky header, sub-brand strip on top**
   - **Observed:** A thin strip of sub-brand wordmarks sits above the main bar, which holds the logo, search, account, wishlist, bag and hamburger. On scroll the strip disappears and a compact 60px bar stays pinned.
   - **Why it grabs attention:** The four core actions (search, wishlist, bag, menu) stay one thumb-tap away. The brand strip makes the house of brands visible without a mega-menu.
   - **How it's built:** `HEADER.sticky top-0 z-20 md:hidden shadow-sm` (computed-style query). The menu and cart are off-canvas drawers (`fixed w-[85%] inset-y-0 left/right`) with a gray overlay, already mounted in the DOM.

3. **Full-screen campaign hero carousel**
   - **Observed:** A near-full-height lifestyle photo of three men in festive panjabis, with a short white headline, a sub-line and a black "SHOP NOW" box. It has side arrows, rotates through 5 slides, and each slide is one link to the campaign.
   - **Why it grabs attention:** People fill the frame and the season (Puja) is obvious, so a menswear shopper sees "this is for me" in under a second. Each slide has one clear CTA.
   - **How it's built:** An Embla carousel (`.embla__container`). Slides use `next/image` `fill` with height `calc(100vh-100px)`. Separate mobile (`r-…`) and desktop (`d-…`) art are both in the DOM, toggled with `block md:hidden`. Images are Magento Mageplaza banner-slider assets on `media.aarong.com`.

4. **Category tiles: 2-column photo grid with labels**
   - **Observed:** Directly under the hero is a grid of 8 tiles (Women, Men, Kids, Home Decor, Jewellery, Skin & Hair, Gifts & Crafts, Wedding). Each tile is a seasonal photo with an uppercase label bar under it.
   - **Why it grabs attention:** It works as fast self-selection. The tile photos are refreshed for the campaign, so even navigation feels new.
   - **How it's built:** `next/image` with `sizes="(max-width:768px) 100vw, …"` and paired mobile/desktop thumbnails, `loading="lazy"`.

5. **Editorial banners, then a single "What's New" product carousel**
   - **Observed:** After the tiles come 2 full-width lifestyle banners. Then a "WHAT'S NEW" carousel shows **one large product image per slide** (3:4, auto-advancing, 10 dots, arrows), followed by VIEW MORE. The first product image starts about 2,600px down, roughly 3 screens. The rest of the page (about 7,800px) is more campaign and promo banners: a sub-brand campaign, gift boxes, same-day delivery, a bank cashback offer, back-to-campus, jewellery.
   - **Why it grabs attention:** The images are large and beautiful. But shoppable products come late, and only one is visible at a time.
   - **How it's built:** Embla with dot pagination. Product images come from `media.aarong.com/media/catalog/product/…?width=…` (Magento catalog paths). Cards open the PDP with `target="_blank"`.

6. **Product card: image only, with a "+" reveal**
   - **Observed:** The card shows no name or price. A round gray "+" button in the corner opens a small popover with the name (truncated), the price ("Tk 1,600.00") and a close X.
   - **Why it grabs attention:** It keeps the image clean. The cost is weak price scent, because shoppers have to tap to learn the price.
   - **How it's built:** Headless UI Popover (`headlessui-popover-button-*`, `data-headlessui-state`).

7. **Promo interstitial + cookie bar on load**
   - **Observed:** A centered modal promo (a telecom-partner discount) covers the hero on first load. A cookie consent sheet also covers the bottom 30% and comes back on every page load after "Close".
   - **Why it grabs attention:** The offer is seen, but it hides the hero and delays the first product view.
   - **How it's built:** The modal's close control is a `div` holding an SVG (no `button`, no label).

8. **Trust and offers delivered as image banners**
   - **Observed:** Same-day delivery (Dhaka, order by a cut-off time), bank-card cashback and "available at all outlets" all appear only as baked-in banner images. There is no persistent text trust bar.
   - **How it's built:** Banner images (PNG originals, WebP at the CDN).

9. **Footer:** a newsletter block (email + mobile number, with a radio for in or outside Bangladesh), accordions (Who we are / Categories / Customer service / More), social icons and app-store badges.

**Platform and performance (homepage):**
- The frontend is headless Next.js (`/_next/static/chunks/*`, about 59 script entries in `ev_c43f3fa3…`). The backend is **Magento** GraphQL at `mcprod.aarong.com/graphql` (queries `CMSHomePage`, `categories`, `products(filter:{category_id…})`), proxied via `www.aarong.com/api/graphql`.
- The image CDN is **Tenbyte CDN / Image Optimizer** (`server: TenbyteCDN`, `x-image-optimized: WEBP`, quality 75). A ~800KB hero PNG is served as an ~83KB WebP via `?width=` (response headers). There is no AVIF.
- **The hero images are `loading="lazy"` with no priority/fetchpriority**, which is bad for LCP. The banner srcset goes up to 3840w.
- Fonts are self-hosted **Futura PT** (400/500/600 loaded), plus Inter and "Century Old" declared.
- Third parties are GTM (`GTM-53DWLW`), 2× GA4, Google Ads conversion and Meta Pixel. There is no chat widget and no reviews vendor.
- 97 resource entries were recorded at load (resource timing).
- **Language:** `<html lang="en">`. There is no Bengali toggle anywhere, and BDT is shown as "Tk 1,600.00" (Latin "Tk", always 2 decimals).

## PDP

1. **Breadcrumb + single tall image**
   - **Observed:** The breadcrumb (Home / Wedding / Men / Panjabi / product) sits above a 3:4 studio shot on white, with a wishlist heart overlaid at top right. This product had **1 image**: no dots, no thumbnails, no zoom affordance.
   - **Why it grabs attention:** The clean, consistent white-background studio shots make the colour and cut easy to judge. With only one image, though, there is no back view, embroidery close-up or fabric detail, which matters a lot for aari-embroidered silk.
   - **How it's built:** An Embla container with 1 slide. The image is `loading="auto"` without `sizes`, so a 1920px-wide file (~104KB WebP) is fetched for a 358px slot. 828w would be ~31KB (curl comparison).

2. **Title → price → quantity + size, side by side**
   - **Observed:** The title (2 lines) and a share icon sit on one row. Below them is the price "Tk 5,327.27" (odd paisa decimals, no strike-through or discount). Then a quantity stepper and a native size `<select>` ("Choose an Option…", with one size, 42, available) share a row.
   - **Why it grabs attention:** It is compact, and the price shows in the first 1.5 screens. But a dropdown hides which sizes exist or are sold out. Sold-out sizes simply don't appear.
   - **How it's built:** A native `select` (options: a disabled placeholder plus "42").

3. **Accordion stack between the picker and the CTA**
   - **Observed:** Size Guide, Product Code, Product Description and Reviews are single-open accordions. The description is a one-line summary plus a spec table (colour, fabric, embroidery type, fit, side cut, collar, pocket, sleeve, length, care). The size guide opens to a mini product card and a "Size Chart" image (it showed only a placeholder). Reviews said only that reviews are limited to verified buyers. It showed no stars and no count.
   - **Why it grabs attention:** The structured spec table is very scannable for panjabi buyers (fabric, collar, fit). Putting the accordions *above* the CTA pushes "ADD TO BAG" down, though.
   - **How it's built:** The headers are `span`s with no `aria-expanded` (DOM query), so they are not accessible disclosure buttons.

4. **"Find in store" + full-width ADD TO BAG**
   - **Observed:** "FIND IN STORE" opens a list of the physical outlets that stock the item (address, phone, hours). Below it is a black full-width ADD TO BAG button. **It is not sticky**: the computed-style scan found only the header as sticky/fixed on the PDP.
   - **Why it grabs attention:** Store availability is a strong trust signal in Bangladesh (touch the fabric, exchange in person). There is no delivery or COD/return info near the CTA, and no WhatsApp/chat (no `wa.me`/`m.me` links found).

5. **Two recommendation rails**
   - **Observed:** "SIMILAR PRODUCTS" (pricier silk panjabis) and "YOU MAY ALSO LIKE" (cheaper cotton panjabis). Each is a 2-up carousel with image, wishlist heart, a "QUICK VIEW" overlay, a 2-line name and the price.
   - **Why it grabs attention:** One rail sells up and one sells down (lower prices), so it catches both budget-sensitive and premium shoppers. These cards *do* show name and price, unlike the homepage cards.

**SEO / build (PDP):** The `<title>` is the URL slug ("magenta-aari-…-panjabi.html | Aarong"). There is no `<h1>`, **no JSON-LD**, no `og:image`, and the meta description is the generic site-wide one. The canonical is present (DOM query, PDP inspect `ev_90e9e6b8…`).

## Weak spots (anti-patterns)

- A country gate, a promo modal and a cookie sheet all appear before the first product. The cookie choice isn't remembered on "Close".
- Products start about 3 screens down on the homepage, and only 1 product is visible at a time in the carousel.
- Homepage product cards hide name and price behind a "+" tap, and open the PDP in a new tab.
- The hero LCP image is lazy-loaded. PDP images have no `sizes`, so ~3× more bytes are fetched than needed.
- One gallery image on a premium embroidered item, with no zoom.
- A size dropdown instead of visible size chips. Out-of-stock sizes are invisible rather than shown as unavailable.
- No sticky add-to-cart. The CTA sits below 4 accordions, and no delivery/COD/returns info is near it.
- No visible reviews or ratings on the PDP.
- Weird VAT-derived prices (Tk 5,327.27) with 2 decimals everywhere.
- No Bengali UI despite the Bangladeshi audience.
- Non-button close and accordion controls (a11y).
- Slug as the page title, no h1, no Product JSON-LD.

## Takeaways for our punjabi store

- Use a lifestyle hero with people in the product and a seasonal/festival message (Eid, Puja, Pohela Boishakh), with one CTA. **Load it eagerly with priority**, unlike Aarong.
- Put a 2-column category tile grid right below the hero (Panjabi, Pajama sets, Koti, Wedding…).
- Bring products **into the first 1–1.5 screens** as a 2-up grid with name + `<Price>` always visible. Don't use image-only cards.
- Add a spec table in the PDP description (fabric, embroidery, fit, collar, sleeve, length, care). Panjabi buyers want this.
- Pair rails: "Similar" (same price band) plus "You may also like" (a cheaper alternative).
- Use visible size chips with crossed-out sold-out sizes and an inline size chart near the picker.
- Add a sticky bottom add-to-cart bar on mobile, with a delivery/COD/exchange line right next to it.
- Show multiple gallery images (front, back, embroidery close-up) with dots and pinch zoom.
- Replace image-only trust banners with a text trust strip (same-day Dhaka, COD, easy exchange) that we can translate into Bengali.
- Round BDT prices with no paisa, and offer a Bengali UI (we already have `next-intl`).

## Measure later (with `analytics`)

- Scroll depth to the first product row and the homepage product-click rate (products high vs. low).
- Card click-through when name + price are always shown.
- Add-to-cart rate with vs. without the sticky ATC bar.
- Size-picker errors / "select a size" prompts after chips plus an inline size chart.
- PDP gallery swipes and zoom use vs. add-to-cart.
- Click share for the similar vs. cheaper rail, and the revenue they drive.
- Checkout start rate when the trust strip (COD/delivery) sits near the CTA.
- Bengali vs. English locale share and conversion per locale.

# Yellow: mobile UX teardown

- **Site:** Yellow (Bangladeshi fashion brand), https://www.yellowclothing.net
- **URLs analyzed:**
  - Homepage: `https://www.yellowclothing.net/`
  - Collection (used to reach the PDP): `https://www.yellowclothing.net/collections/mens-casual-shirt` (from the homepage's "Casual Shirts" category tile)
  - PDP: `https://www.yellowclothing.net/products/m-c-shirt-277?variant=67646869995772` (Regular Fit Stripe Casual Shirt, the first product link in that collection)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 at DPR 2, mobile + touch emulation (CDP `Emulation.setDeviceMetricsOverride`), iPhone iOS 18 Safari UA
- **Method:** REA (`inspect_web_page`, `capture_web_screenshot`) plus headless Chrome on port 9224, driven by small CDP scripts for scrolling and DOM/`performance` reads. REA's page inspection is scoped to the site's own origin, so I took third-party hosts from `performance.getEntriesByType("resource")`.

REA evidence IDs: homepage screenshots `ev_aec48f9c…`, `ev_4e94abdf…`, `ev_26f49001…`, `ev_38fd596c…`; homepage inspect `ev_118d6549…`; collection screenshot `ev_29469146…`; PDP screenshots `ev_80a5a0fd…` (above the fold), `ev_54993f9f…` (price/variants), `ev_ea3fcb0e…` (CTA/related), `ev_88438ece…` (sticky cart); PDP inspect `ev_b7fe8eb7…`.

**Platform:** Shopify, running the Ella 6.6.2 theme by HaloThemes (`window.Shopify.theme` reports schema_name "Ella", version 6.6.2; assets load from `/cdn/shop/t/32/assets/halo-*.js`). It is built on jQuery 3.6.0, uses Slick for carousels (`slick-initialized` class, `jQuery.fn.slick` exists) and lazysizes for lazy loading. The font is Poppins, 300 to 800, from Google Fonts. Images go through Shopify's CDN behind Cloudflare and are converted to WebP when the browser accepts it: a `.png` URL came back as `content-type: image/webp` with `cf-cache-status: HIT`.

---

## Homepage

1. **Logo-centred header with four icons, no visible nav**
   - **Observed:** A white bar: hamburger and search on the left, a spaced-out wordmark in the middle, account and a cart icon with a count badge on the right. The header stays on screen while you scroll the category grid, then hides further down.
   - **Why it grabs attention:** Almost no chrome, so the photography gets the screen. The cart count stays in reach.
   - **How it's built:** The header section is `position: sticky` (`section-header-mobi`). The menu is an off-canvas sidebar from the theme. Search is predictive (`predictive-search.js`, from the REA script inventory).

2. **Rotating hero campaign carousel (~220px tall)**
   - **Observed:** A full-bleed campaign image with the campaign name in Bengali and English, small dots, and no CTA button. It rotates through 3 slides.
   - **Why it grabs attention:** It works for brand mood and festival timing (Puja). Without a CTA, though, the user has to guess that the image is tappable.
   - **How it's built:** Slick slider with `autoplay: true`, 3000ms (read from the live Slick options). Images use `srcset`, `sizes="100vw"`, a `&width=1100` CDN transform, and are loaded eagerly. No video.

3. **Trust ticker placed *under* the hero**
   - **Observed:** One line rotating through "free 15-day exchange", "free shipping countrywide" and "5–8 day delivery".
   - **Why it grabs attention:** These cover the three biggest worries for a Bangladeshi online shopper: fit risk, shipping cost and delivery time. Putting the line right under the hero image means people actually read it.
   - **How it's built:** The theme's `announcement-bar`, rendered as a Slick ticker with cloned slides (DOM `.announcement-bar__message.slick-slide`). It sits at y≈269, after the slideshow (y=50).

4. **Editorial campaign copy block**
   - **Observed:** A centred campaign title, then about 8 lines of grey storytelling text before any shoppable content.
   - **Why it grabs attention:** It builds the brand story, but on mobile it pushes products down.
   - **How it's built:** A plain rich-text section.

5. **"Top categories" 2-column image tiles**
   - **Observed:** Big portrait tiles in 2 columns (Ethnic Men, Lawn, Western, Casual Pants, Kids, MiniMe, Newborn, Home), each with a white label laid over the bottom of the photo. A second campaign carousel follows, then another tile grid (Casual Shirts, Formal, Tops, Ethnic Women).
   - **Why it grabs attention:** Each tile is a large tap target that shows a person wearing the category. It is the fastest way into a catalogue for someone browsing on a phone.
   - **How it's built:** Lazy images (`loading="lazy"`, `_355x` CDN size, `sizes="calc((100vw - 50px) / 2)"` on mobile), as seen in the DOM.

6. **No products on the homepage at all**
   - **Observed:** No product cards, prices or "new arrivals" row anywhere on the ~3,200px page. The first price shows up only after you go into a collection.
   - **Why it matters:** The homepage is a category router, not a shop window. That works for a known brand, but it costs a tap before the customer sees a price. (See Weak spots.)

7. **Fake-style "someone purchased" popup app is installed**
   - **Observed:** It did not show during my session, but the container is in the DOM (`halo-notification-popup … show_someone_purchase_mobile`), and the third-party Pop Convert SDK loads (`sdk.pop-convert.com`).
   - **How it's built:** `halo-someone-purchase.js` (REA script inventory) plus the Pop Convert scripts.

8. **Footer**
   - **Observed:** A sister-brand logo strip, three accordion groups (Information, Policies, Customer Service), round social icons and a single image showing every payment method.
   - **How it's built:** The payment strip is one static JPG, not individual logos.

**Weight:** 334 requests and about 193 KB transferred as measured by `performance` (many assets came from cache or were cross-origin opaque). DOMContentLoaded at about 2.6s, load at about 4.4s. Third parties: GTM/GA4, Google Ads/DoubleClick, Meta pixel, Pop Convert, StarApps, and Shopify telemetry.

### Collection card anatomy (seen on the way to the PDP)
- A 4:5 portrait photo on a plain studio background, a **full-width dark "Add to cart" bar directly under the image**, a centred 2-line title, and the price shown as `Tk 1,995.00`. Small **image swatches** for other colours sit underneath, and a sold-out colour is shown as a struck-through chip. There is no discount badge and no second image on hover.

---

## PDP

1. **Big gallery with an image counter**
   - **Observed:** A portrait model shot fills about 60% of the first screen. It has a zoom (expand) button, a "1 / 9" counter, prev/next arrows, and a 3-thumbnail strip with its own arrows below.
   - **Why it grabs attention:** Nine images, with the count shown, tell the shopper there is a lot to see. Full-body shots on a neutral background show fit well.
   - **How it's built:** Slick main slider plus a thumbnail slider (`halo-productView-left productView-images`, 27 Slick slides including the thumbnail track). **Every gallery image loads at its original 4000×5000 size:** REA reports `image/webp` resources of 3.7 MB, 2.6 MB and 2.0 MB (`ev_b7fe8eb7…`). The PDP transferred **about 13 MB across 422 requests**.

2. **Title, then SKU and type metadata, *before* the price**
   - **Observed:** The title in bold, a share icon, then SKU and product-type lines. The price `Tk 1,895.00 + VAT` appears only after you scroll (about y=720).
   - **Why it matters:** The price is pushed below the fold by internal metadata. This is an anti-pattern.

3. **Image-swatch colour picker plus text size pills**
   - **Observed:** "Color – BROWN & WHITE STRIPE" with large photo swatches (the selected one has a dark border), then text-only size options S to XXL with a circle around the one selected. Directly under the sizes is a **fit note giving the model's height, weight and the size he is wearing**.
   - **Why it grabs attention:** Photo swatches beat colour dots for patterned shirts. The model-fit line answers "which size do I order?" without opening a chart.
   - **How it's built:** Shopify `product-form__radio` inputs, duplicated for a separate mobile layout. All sizes were enabled for this variant, so I did not see an out-of-stock size state on this PDP. The swatch images come from StarApps (`cdn.starapps.studio`).

4. **Accordions for the size guide and description**
   - **Observed:** "Size Guide" (collapsed; its content is a single image, not a table) and "Description" (open: a short paragraph plus the fabric composition).
   - **How it's built:** Theme toggles. The size guide holds 1 `<img>` and 0 `<table>`.

5. **CTA block: free-shipping line, Add to cart, wishlist, Buy it now**
   - **Observed:** A truck icon with "Free Shipping" and a "?" tooltip, then a dark full-width ADD TO CART with a round wishlist heart next to it, then an outlined BUY IT NOW (Shopify's dynamic checkout).
   - **Why it grabs attention:** The free-shipping reassurance sits right next to the button. "Buy it now" gives impulse buyers a one-step path.

6. **Sticky bottom add-to-cart bar**
   - **Observed:** Once the main CTA scrolls out of view, a bar fixed to the bottom shows a wishlist heart and a wide ADD TO CART button.
   - **How it's built:** `.productView-stickyCart … show-sticky animate`, `position: fixed`. Its hidden markup also contains the product title and price.

7. **Related products carousel plus recently viewed**
   - **Observed:** "Related products": 2-up cards with a wishlist heart, title, `Tk … + VAT` and a swatch, plus pagination dots. "Recently viewed" follows below it.
   - **How it's built:** Slick, `recently-viewed-product.js`, `build-complementary-products.js` (REA script list).

8. **Missing: reviews, stock urgency, WhatsApp chat**
   - There are no ratings or reviews (no review app in the DOM; the Product JSON-LD has `offers` but no `aggregateRating`). There is no "only X left" message. The only WhatsApp link is a *share* link (`wa.me/?text=…`), not a chat with the store. JSON-LD does include Organization, Product and BreadcrumbList.

---

## Weak spots (anti-patterns)

- **The homepage has no products and no prices.** Purchase intent waits for a second page load.
- **The hero has no CTA**, and the campaign story text pushes the category tiles below the first screen.
- **The PDP price is below the fold**, behind SKU and product-type metadata that shoppers don't care about.
- **Full-resolution gallery images (2–4 MB each, about 13 MB per PDP)** are very slow on Bangladeshi mobile data.
- **The size guide is an image:** you can't zoom into it well, it can't be translated, and screen readers can't read it.
- **"+ VAT" sits next to the price** with no total, which adds price uncertainty.
- **No reviews or social proof on the PDP.** The only social-proof device is a "someone just bought" popup app, which shoppers tend to distrust.
- The trust ticker rotates every few seconds, so a reader may only catch one of the three promises.
- Lots of third-party tags (GTM, Ads, Meta, Pop Convert), with jQuery and Slick on the main thread.

## Takeaways for our shirts store

- Put a **compact trust strip (exchange window · free/flat delivery · delivery estimate)** directly under the hero. Show it statically, not rotating, on mobile.
- **Big 2-column category tiles that show a person wearing the category** are a fast way into the catalogue. Ours should come before any long copy.
- Unlike Yellow, **show a product row with prices on the homepage** (new arrivals or best sellers) within the first two screens.
- **Product card:** a 4:5 photo, a full-width add-to-cart under the image, a clear `Price`, and **image swatches with a struck-through sold-out state**.
- **PDP order:** gallery, then title, then **price right under the title**, then colour (image swatches), then size pills plus a **model-fit line ("model 6'2", wearing L")**, then CTA plus a delivery/exchange line.
- An **image counter ("1 / 9")** and zoom on the gallery, but serve images through `srcset`/`sizes` and resize them (sharp), never as originals.
- A **sticky bottom add-to-cart bar** once the main CTA scrolls off screen.
- A **size guide as an accessible, translatable table** in an accordion, not an image.
- Add what Yellow lacks: **reviews/rating near the title**, honest low-stock text, and a **WhatsApp "order/ask" button** (we already support WhatsApp handoff).

## Measure later (analytics feature)

- Homepage product row vs. category-only: homepage → PDP click-through and time to first PDP view.
- The trust strip under the hero: scroll depth, and checkout-start rate for sessions that saw it.
- Sticky add-to-cart bar: add-to-cart rate split by inline vs. sticky button.
- Placing the price under the title, and the model-fit line: PDP → add-to-cart conversion, and size-related exchanges or returns.
- Card-level quick add: adds from collection vs. from PDP.
- WhatsApp button: taps per PDP view and the resulting orders.
- Image weight: PDP LCP on mobile, compared with bounce rate.

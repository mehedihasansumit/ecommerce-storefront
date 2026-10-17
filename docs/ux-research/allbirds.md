# Allbirds: mobile UX research (reference for our shoes store)

- **Site:** https://www.allbirds.com (US storefront)
- **URLs analyzed:**
  - Homepage: `https://www.allbirds.com/`
  - PDP: `https://www.allbirds.com/products/mens-dasher-nz-anthracite`, a men's shoe linked from the homepage's Dasher NZ hero and product carousels. The site appended `_su_rec` recommendation-tracking query parameters after load.
- **Date:** 2026-10-16
- **Viewport / UA:** 390×757 CSS px (window 390×844), iPhone iOS 18 Safari UA, touch enabled
- **Method:** REA (`capture_web_screenshot`, `inspect_web_page`) plus my own headless Chrome over CDP for scrolling and DOM/`performance` probes. A "Where are we shipping to?" geo modal appeared on first load. I dismissed it with its close button (I did not pick a country).
- **REA evidence:** homepage screenshot `ev_737cc6ac…`, homepage inspect `ev_f5f4d70d…`, PDP screenshot `ev_e54e2537…`, PDP inspect `ev_03067fc5…`. REA's inspect only kept same-origin data (`policy_filtered`), so the third-party script, network and weight figures below come from CDP `performance.getEntriesByType('resource')` and DOM probes.

## Homepage

1. **Rotating announcement bar**
   - **Observed:** A dark bar at the top with prev/next arrows. It alternates between a shipping-delay notice and "free ground shipping over a threshold".
   - **Why it grabs attention:** The free-shipping threshold is the first thing a visitor reads, so the price objection gets answered before any product appears.
   - **How it's built:** A Swiper fade carousel with 2 slides (`.swiper.swiper-fade`, DOM probe), rendered as a Shopify section.
2. **Floating, inset sticky header**
   - **Observed:** A white rounded "pill" header (hamburger, centered logo, search, bag) floats over the hero with a margin on every side. It stays visible while scrolling.
   - **Why it grabs attention:** It barely covers the hero but keeps search and the cart one tap away.
   - **How it's built:** The `header-group` section is `position: sticky` (computed style).
3. **Full-bleed 9:16 hero with two gender CTAs**
   - **Observed:** A tall lifestyle photo of the shoe on foot fills most of the first screen. On top sit a small monospace eyebrow, a two-line serif headline and two white pill buttons: "Shop Men" / "Shop Women".
   - **Why it grabs attention:** The product itself (not a model's face) is the focal point. The gender split routes visitors to the right size range in one tap, and the buttons sit within thumb reach.
   - **How it's built:** Art direction is done with **two `<img>` tags**: a mobile `…_Mobile_9x16…&width=1024` image (`block md:hidden`) and a desktop `…_16x9…&width=2560` image (`hidden md:block`). Both have `loading="eager"`. See Weak spots.
4. **Category bubbles, then products at about 1.3 screens down**
   - **Observed:** Below the hero is a horizontal row of large rounded tiles (a "New Arrivals" tile and others), each with Men/Women buttons. A "Best Sellers" carousel follows at around 1,000px of scroll.
   - **Why it grabs attention:** A peek of the next tile at the right edge invites swiping. Even so, real product cards appear fairly late on mobile.
   - **How it's built:** Swiper with `!overflow-visible`, so the next slide peeks in.
5. **Product card anatomy**
   - **Observed:** A white rounded card about 278px wide (roughly 1.4 cards visible) holds a square image (shoe in profile on a neutral background), a "NEW" pill badge at top-left, an uppercase name, the colorway name, the price and a single color-dot swatch. Nothing extra appears on the card in mobile view.
   - **Why it grabs attention:** Consistent left-profile packshots make cards easy to scan and compare, and the price is always visible. The card is minimal, with no clutter.
   - **How it's built:** `aspect-square` container. A second stacked `<img>` (`opacity-0`, `fetchpriority="low"`) acts as the hover image. Each card carries `data-product-variants` JSON with per-size `available` flags, which supports quick-add and stock state without an extra request. Cards also carry impression/click attributes (`data-impression-id`, `data-product-link-position`, `data-above-fold`).
6. **Storytelling banners**
   - **Observed:** Stacked full-width rounded photo cards for seasonal themes (travel slides, new arrivals, fresh colors), each with a serif headline and outlined Men/Women buttons.
   - **Why it grabs attention:** They use mood and context, and every banner still ends in a gendered shortcut.
   - **How it's built:** Shopify sections with lazy `<img>` (`group-hover:scale-108` zoom on desktop).
7. **Value-prop cards before the footer**
   - **Observed:** Three text cards cover comfort, everyday wear and natural materials.
   - **Why it grabs attention:** They restate the brand promise as the reason to buy.
8. **Floating AI shopping pill**
   - **Observed:** A bottom-center pill ("Shop Best Sellers" / "Shop Deals" / "Shop with AI", rotating) with a dismiss X. It stays on screen the whole time.
   - **How it's built:** A third-party AI shopping agent injected from `adsagentclientafd-…azurefd.net/frontendInjection.js`.
9. **Footer**
   - **Observed:** Email signup first, then accordion link groups (Help / Shop / Company), social icons, country selector and legal links.

**Not present on the mobile homepage:** star ratings on cards, review counts, a trust row (returns, warranty) and countdown or scarcity urgency.

## PDP (Men's Dasher NZ)

1. **Title and price block above the gallery**
   - **Observed:** A breadcrumb (Home / Mens), a serif H1, an "also available in women's sizes" link, the price and a "+ free shipping" pill. All of this sits above the image.
   - **Why it grabs attention:** The product's name and price are visible in the first glance. The free-shipping pill attaches the incentive right to the price.
   - **How it's built:** Liquid-rendered `h1.font-serif`. The product object is serialized into the `data-product-object` attribute of the `main-product` section.
2. **Swipe gallery with dots**
   - **Observed:** 5 images with a white background: side, back, top-down, sole and pair. A "NEW" badge sits on the image, with pagination dots below.
   - **Why it grabs attention:** The fixed set of angles answers "what does the sole and heel look like" without needing zoom.
   - **How it's built:** A mobile-only Swiper (`md:!hidden`) with 5 slides and 5 bullets (`.product-hero-pagination`). The first image is `loading="eager"` and the rest are `lazy`. No `srcset`: each image is a single `&width=` URL decoded at 1280px wide for a 375px slot.
3. **Color swatches as separate products**
   - **Observed:** 8 round swatches. The active one is ringed, the label reads "COLOR: Anthracite (Limited Edition)", and a "SALE" tag sits under a discounted colorway.
   - **Why it grabs attention:** Labelling a color as limited edition or on sale adds scarcity and value cues right at the point of choice.
   - **How it's built:** Each swatch is a `button[data-color-swatch][data-handle=…]`, so every colorway is its own Shopify product handle. `data-edition` and `data-sale` drive the tags.
4. **Size grid with clear out-of-stock state and fit advice**
   - **Observed:** Men's/Women's size tabs, then a 5-column grid of square size buttons. Sold-out sizes are greyed and struck through diagonally. A one-line fit note says the shoe runs true to size, with a "Fit Guide" link. After I selected size 9, the swatches **for colors unavailable in that size became struck through too**.
   - **Why it grabs attention:** Customers see availability before they commit. The fit note removes the biggest objection to buying shoes online (sizing), and cross-filtering color by size prevents dead ends.
   - **How it's built:** `<li data-variant-available data-variant-sku …><button class="btn-size" aria-label="Select size 8">`, with an SVG diagonal line for out-of-stock (`data-testid="pdp-size-selector-button-oos"`).
5. **CTA that changes state, plus sticky add-to-cart**
   - **Observed:** Before a size is picked, the CTA is a grey "Select a size". Afterwards it becomes black "Add to Cart – $140". Free shipping is restated under the button. Once the inline CTA scrolls away, a bottom sheet with the name, price and the same CTA stays docked.
   - **Why it grabs attention:** The button itself tells the user the next step. Putting the price in the label confirms the cost at the moment of commitment, and the sticky bar keeps the buy action one tap away during long storytelling.
   - **How it's built:** A `fixed bottom-[0dvh]` rounded-top container (about 119px tall, computed style), toggled by scroll position.
6. **Accordion description**
   - **Observed:** "Why we love this" is open by default: a short paragraph, a bulleted list with bold feature names, "Best for" activity chips (walking, jogging, commuting…) and a "View technical details" link. "Materials & sustainability" and "Care" are collapsed.
   - **Why it grabs attention:** Benefits are visible first, while specs and sustainability are one tap away. The activity chips let shoppers check fit for their own use case at a glance.
7. **Lifestyle carousel and collection banner**
   - **Observed:** A serif headline, then a swipeable set of on-foot photos with short benefit captions ("look good", etc.), then a colored collection banner with a CTA.
   - **How it's built:** Swiper with 3 slides.
8. **"You may also like"**
   - **Observed:** A carousel of the same card style, but **each card has an "Add to Cart" row**.
   - **Why it grabs attention:** Adding a second item takes one tap, with no detour to another page.
   - **How it's built:** Swiper with 11 slides. The cards use the same variant-availability JSON as homepage cards.
9. **Reviews**
   - **Observed:** A "Reviews for Men's Dasher NZ" heading near the bottom, but the widget body **never rendered** in my session. **No star rating appears near the title.**
   - **How it's built:** Yotpo (`.yotpo-widget-instance`, `use-yotpo-composable.js`). JSON-LD includes `ProductGroup` and an `AggregateRating` of 4.6 from 51 reviews, so the rating exists for SEO but isn't shown above the fold.

### How it's built (both pages)

- **Platform:** Shopify Online Store 2.0, with a custom Liquid theme (`Shopify.theme.schema_name = "allbirds-theme"`, v1.231.12) and Vue islands (13 `[data-v-app]` roots on the PDP). It is not Hydrogen or Next.
- **Styling:** Tailwind utility classes throughout the DOM.
- **Carousels:** Swiper.
- **Images:** Shopify CDN `/cdn/shop/files/…&width=N`. It negotiates format by `Accept` header: the same URL returned `image/webp` at 82 KB vs `image/png` at 523 KB (curl test). I saw no AVIF, almost no `srcset` (1 of 42 images on the homepage), and no `<picture>`. Below-fold images are lazy (25 of 42).
- **Fonts:** Geograph (sans), Self Modern (serif headlines), Akkurat Mono (eyebrows/labels) and Barlow.
- **Third parties:** GTM plus several gtag/Google Ads IDs, Meta pixel, Microsoft Clarity, OneTrust, Attentive (SMS), Impact (affiliate), GovX, Redo (returns), Yotpo, the AI shopping agent, and Shopify web-pixels sandbox iframes.
- **Weight (CDP `performance`, includes lazy loads triggered by my scrolling):** homepage 521 requests / ~5.3 MB transferred, DOMContentLoaded about 3.9 s. PDP 551 requests / ~2.1 MB (warm cache), load about 5.5 s.

## Weak spots (anti-patterns)

- **Both hero images download on mobile:** both are `loading="eager"` and hidden only with CSS, so the 2560px desktop JPEG (~572 KB) loads on a phone alongside the mobile image (~174 KB).
- **No responsive `srcset`:** 1024 to 1280px images are sent to 278 to 375px slots.
- **Rating hidden:** a 4.6★ / 51-review rating exists in JSON-LD but not near the PDP title or on cards. In my session the review widget didn't render at all.
- **AI chat pill and speech bubble overlap the inline Add-to-Cart button and size grid.** They cover the main CTA.
- **Products appear late on the homepage** (about 1.3 screens) because category tiles come first.
- **More than 500 requests and a long tail of trackers:** heavy for mid-range Android on 4G.
- **The geo modal blocks first paint content** for visitors from outside the US. Its close button relies on an `sr-only` label, but at least it has one.
- **Shipping-delay message** in the announcement bar is a negative signal shown right next to the positive one.

## Takeaways for our shoes store

- Put **title, price and a free-delivery pill above the gallery** on mobile.
- **Size grid with a struck-through sold-out state**, plus a one-line fit note and a size-guide link right under it.
- **CTA that reflects state:** "Select a size" until a size is chosen, then "Add to cart · ৳price" (`<Price>`).
- **Sticky bottom add-to-cart bar** (name, price, CTA) once the inline CTA scrolls off.
- **Cross-filter colors by size** so customers can't pick a combination that doesn't exist.
- **A fixed gallery shot list** for every shoe (side, back, top, sole, pair) on a neutral background, with dots.
- **Card anatomy:** square packshot, "New"/"Sale" pill, name, color, price, swatch dots. Add a **one-tap add-to-cart on "You may also like"** cards.
- **Accordions:** benefits open by default; materials and care collapsed; "best for" chips.
- **Gender/category split CTAs in the hero.** But show product cards within the first ~1 screen, which is better than Allbirds.
- **Show the star rating and count next to the price** (they don't, and we should).
- Technical: use `next/image` `sizes` for art direction and never eager-load hidden images. Embed per-size availability in card data for quick-add.

## Measure later (with `analytics`)

- Hero CTA click-through (gender split vs single CTA).
- Scroll depth to the first product card on the homepage; card impression → click rate by position (Allbirds tracks position and above-fold on every card).
- PDP: size-selected rate, "Select a size" → add-to-cart conversion, fit-guide opens.
- Sticky ATC bar usage vs the inline CTA.
- Add-to-cart from related-product quick-add.
- Effect of showing the rating near the title on add-to-cart rate.
- Mobile LCP and bytes after removing hidden eager images (track it as a performance metric).

## Not observed

- Yotpo review content (widget empty in headless), the cart drawer, gallery zoom behavior (a zoom class exists, but I didn't test it), hover images (not applicable on touch), and desktop layout.

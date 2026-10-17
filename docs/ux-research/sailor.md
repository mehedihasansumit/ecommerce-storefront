# Sailor: mobile UX teardown

- **Site:** Sailor (Bangladeshi family fashion brand), https://www.sailor.clothing
- **URLs analyzed:**
  - Homepage: `https://www.sailor.clothing/`
  - Collection (used to reach the PDP): `https://www.sailor.clothing/category/mens-shirt-collection` (from the homepage's "Trending Categories" SHIRT tile)
  - PDP: `https://www.sailor.clothing/details/st-ef63-omcs-0913-light-yellow1-51718` ("Mens Casual Shirt (F/S)", the first card in that collection)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 at DPR 2, mobile + touch emulation (CDP `Emulation.setDeviceMetricsOverride`), iPhone iOS 18 Safari UA
- **Method:** REA `capture_web_screenshot` plus my own headless Chrome on port 9227, driven by CDP scripts for scrolling, clicks and DOM/`performance` reads. Unlike the Ecstasy run, I did not take a REA `inspect_web_page` capture for Sailor; DOM facts below come from `Runtime.evaluate`. Third-party hosts come from `performance.getEntriesByType("resource")`, because REA filters out other origins. **I closed a festival-sale pop-up modal** before taking the clean screenshots.

REA evidence IDs: homepage `ev_79493e26…` (with pop-up), `ev_c09d085c…` (above the fold), `ev_c11c8359…` (rails); collection `ev_18804f85…`; PDP `ev_6318fd35…` (above the fold), `ev_da24063c…` (size-chart and store-stock modals), `ev_7a00ff80…` (reviews/fit meter).

**Platform:** Next.js 14.2.16 with the **Pages Router** (`__NEXT_DATA__`, no app chunks) and Bootstrap 5, with jQuery 3.6.1 still loaded. Carousels use **Swiper** (hero, rails) and **Slick** (PDP gallery: a vertical thumbnail nav plus the main slider). Icons come from Font Awesome 6 and IcoFont. Fonts are Inter 400–600 plus Bebas. Product data comes from `backend.sailor.clothing`. Images are served **straight from Oracle Cloud Object Storage (Singapore)**: no image CDN, no `next/image`, no `srcset`. Card images are 800–1040px; the hero slides are **4000px WebP (~775 KB) shown in a 390×142 box**. Third parties: GA4/GTM, Google Ads, Meta pixel, **Microsoft Clarity** (session recording), Umami, Cloudflare Insights, Google Merchant Center analytics and Sign in with Apple.

---

## Homepage

1. **Dark announcement strip plus a centred logo header**
   - **Observed:** A one-line seasonal message, then hamburger / logo / search. On scroll the strip goes away and the header stays fixed.
   - **How it's built:** `.middle-nav.fix-middleNav`, `position: fixed`.

2. **Short, wide hero banner (142px)**
   - **Observed:** A 2.7:1 promo banner (member discount, festival art) instead of a tall lifestyle image. The category section starts at y≈227.
   - **Why it grabs attention:** The hero takes only 17% of the screen, so categories and products move up.
   - **How it's built:** Swiper `home-slider` with 5 slides. The first visible image has `fetchpriority="high"`; the others are `loading="lazy"`.

3. **"Trending Categories" swipeable 2-up tiles**
   - **Observed:** Photo tiles (Polo, T-shirt, Shirt, Footwear…) with a white label box near the bottom and arrow buttons.
   - **How it's built:** Swiper, with each tile linking to `/category/<slug>`.

4. **"New Arrivals" with audience filter chips**
   - **Observed:** Pill chips **MEN / WOMEN / KID / NEWBORN / ACCESSORIES** (the active one filled red) above a 2-up rail. The first product image starts at about y=655 (above the fold), and a "See All" pill closes the section.
   - **Why it grabs attention:** One tap switches the rail between audiences without leaving the homepage. That suits a family brand, and in our setup it would suit a store selling to men, women and kids.
   - **How it's built:** The chips swap the Swiper (`newarrival-slider`) data client-side.

5. **Card anatomy**
   - **Observed:** A 4:5 photo, a wishlist heart top-right, prev/next arrows *on the image*, a grey uppercase 2-line name, then `৳ 1498` with the old price in red strikethrough. On sale items there is a **red circular "30% OFF" sticker** at the top-left.
   - **How it's built:** Each card has two `<img>` with the same src (eager plus lazy), so there is no real second image. Prices sometimes show decimals (`৳ 1270.5`), and the old price has no ৳.

6. **"Sale" rail, a banner, then a blog block ("Latest from Sailor")**
   - **Observed:** Later sections load lazily ("Loading…" placeholders until you scroll). The blog block uses an award story as brand proof.

7. **Bottom tab bar plus floating WhatsApp and Messenger**
   - **Observed:** A fixed **app-style bottom bar: Home / Wishlist (count) / Cart (count) / Account**, and above it a "Need Help?" bubble with green WhatsApp and blue Messenger buttons. All of these stay visible on every page.
   - **Why it grabs attention:** Cart and wishlist are always under the thumb. For Bangladeshi shoppers, a chat button is the main way to place an order or ask a question.
   - **How it's built:** `section.fixmenu-main` (fixed, 63px) and `.floating-help-wrapper` (z-index 998). The chat links go to `wa.me/<number>` and `m.me/<page>` with **no product or page context prefilled**. The bottom-bar icons have **no accessible names**.

8. **Footer:** address, two phone numbers, email, **app download badges (Google Play and App Store)**, and policy links (Return & Exchange, Shipping & Charges, Size Guide, Store Locator).

**Weight:** about 250 requests by the end of the session, 4.6 MB decoded from same-origin entries (cross-origin image bytes were hidden; the hero WebP alone is 775 KB). DOMContentLoaded 0.29s, load 0.89s on a warm cache. There are 22 distinct hosts.

### Collection card anatomy (seen on the way to the PDP)
- A **2-column grid** with a "Filter" pill at the top-right. Every card has the 30% sticker. Photography mixes lifestyle model shots with mannequin shots, which looks uneven.

---

## PDP

1. **Everything needed to buy fits on the first screen**
   - **Observed:** In 844px: a breadcrumb, a gallery with a **vertical thumbnail strip on the left** and a zoom (magnifier) button, the title with a share icon, SKU, `৳ 1498  2140 (30%)`, "Color: Light Yellow", size pills S–XXL, and **ADD TO BAG (black) next to BUY NOW (red)**.
   - **Why it grabs attention:** The shopper sees the photo, price, discount, size and both CTAs without scrolling, which is the strongest above-the-fold layout in this round.
   - **How it's built:** Slick `slider-nav slick-vertical` plus `slider-for`. Images are 1040×1300 WebP. There are 2 images in total, and no video.

2. **Size pills with a sold-out state shown only by colour**
   - **Observed:** The sold-out size S is a **solid red pill**, while the size you select turns dark grey. There is no strikethrough or label, and a sold-out pill can be mistaken for "selected".
   - **How it's built:** `li.nav-item.no-stock` with `background: rgb(212,31,39)`. It is still clickable (`cursor: pointer`).

3. **Accordions: Details / Size Guide / Availability In Store**
   - **Observed:** "Size Guide" and "Availability In Store" each open a modal. **Store availability shows a per-store stock table plus a "Store Location" button.**
   - **Why it grabs attention:** For a brand with many shops, "try it at a store near you" lowers the risk of a first online purchase.
   - **How it's built:** Bootstrap modals (`#modalInfo`, `#modalAvailability`). On this product the Details accordion was **empty**, the size chart was a **placeholder image**, and the store table said "No stock available".

4. **Reviews with a fit meter ("Did the item fit well?")**
   - **Observed:** Average rating, then bars for **Small / True to size / Large**, then rating and sort filters.
   - **Why it grabs attention:** Fit feedback answers the main question for apparel better than stars do.
   - **Caveat:** With 0 reviews it still showed "True To Size 100%", which is misleading.

5. **Rails: "Suggested Category" and "Customer Recently Viewed"**
   - **Observed:** 2-up Swiper rails. They show "No Product Found" until the data loads.

6. **SEO:** a page-specific `<title>`, a canonical URL, og:image, and JSON-LD `@graph` (Organization, WebSite, ItemList, BreadcrumbList, Product with BDT `offers`, no `aggregateRating`).

7. **Missing near the CTA:** delivery time or charge, inside vs. outside Dhaka, COD and returns (these exist only as footer links). There is no stock-count urgency, and the sticky element is the global tab bar, not a product add-to-cart bar.

---

## Weak spots (anti-patterns)

- **Sold-out sizes are shown by a red fill only** and look like the selected state, which fails "colour is never the only signal".
- **Empty Details, a placeholder size chart, and a 100% fit score from zero reviews** all undermine trust.
- The **floating chat bubble overlaps the BUY NOW button** and the right-hand size pills.
- 4000px hero images shown in a 142px-tall box; no `srcset`; images come from a Singapore bucket with no CDN.
- Inconsistent price format (decimals; the old price has no ৳).
- The bottom-bar icons have no labels or `aria-label`.
- The chat links don't pass the product, so the agent has to ask "which item?".
- Heavy tracking stack, including session recording.

## Takeaways for our shirts store

- **Fit-feedback bars in reviews** ("runs small / true to size / runs large"), hidden until there are enough reviews. This fits our `reviews` feature as one extra field per review.
- **App-style bottom tab bar** (Home / Categories / Cart with count / Account) on mobile storefront pages, with text labels and `aria-label`s.
- **Audience chips on the homepage rail** (Men / Women / Kids) that filter in place.
- **Short, wide promo hero** for sale periods, so products start above the fold.
- **Floating WhatsApp/Messenger button that prefills the product name, URL and chosen size**, placed so it never covers the CTA (or hidden while the CTA is on screen).
- **"Available in store" check** for tenants that have physical shops (a later idea, needs stock per location).
- Put "Add to cart" and "Buy now" next to each other above the fold on the PDP, as long as our gallery stays at about 400px.

## Measure later (with `analytics`)

- PDP add-to-cart rate when both CTAs are above the fold vs. below.
- Bottom tab bar taps (cart, wishlist) and cart-open rate vs. a header-only layout.
- Chip taps on the homepage rail and the PDP click-through that follows.
- WhatsApp clicks per PDP view, and orders traced to a prefilled message.
- Size-exchange rate before and after showing fit-feedback bars.

*Not observed:* real reviews (the product had 0), the size chart content (placeholder), delivery charges (checkout is out of scope), the Bangla UI (site is English only, `lang="en"`), and swipe gestures (driven by script, not touch).

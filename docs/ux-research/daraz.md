# Daraz Bangladesh: mobile UX teardown

- **Site:** Daraz Bangladesh (Alibaba/Lazada group marketplace), https://www.daraz.com.bd
- **URLs analyzed:**
  - Homepage: `https://www.daraz.com.bd/`
  - Category route used to reach the PDP: bottom tab bar "Categories" → "Men's & Boys' Fashion" → "Clothing" → "Kurtas and Panjabis" tile, which opens `https://www.daraz.com.bd/catalog/?q=Kurtas%20and%20Panjabis&from=lp_category…`
  - PDP: `https://www.daraz.com.bd/products/-i325269082-s1871293758.html` (white cotton panjabi with a contrast chest panel, the first result; tracking query string removed)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844, mobile and touch emulation through CDP `Emulation.setDeviceMetricsOverride`, iPhone iOS 18 Safari UA
- **Method:** REA (`capture_web_screenshot`, `inspect_web_page`) plus my own headless Chrome on port 9230, driven by small CDP scripts that scroll, tap and read the DOM and `performance`. No slider captcha appeared. REA screenshots render at its own 500px window size, so the 390px screenshots I reviewed came from `Page.captureScreenshot` with the emulation applied. REA only inspects the site's own origin, so I took third-party hosts and page weight from `performance.getEntriesByType('resource')`.
- **Pop-ups:** a "Daraz App / Open" banner is pinned to the top of the homepage, and a "Download Daraz App" bottom sheet appears on the listing page. I didn't dismiss either one, and neither blocks the content.

REA evidence: homepage screenshot `ev_feac78762b1beb3c0…`, PDP inspect `ev_e436f41cda6ff99b…`.

**Platform:** Alibaba's in-house mobile stack. The homepage is built with **Rax** (Alibaba's React-like framework). Its whole page scrolls inside a `div.rax-scrollview-vertical` (8,067px tall) and not on `window`, and globals `lib` and `g_config` exist. The PDP is React (`window.React`). Images come from `img.drz.lazcdn.com` and `img.lazcdn.com`, with the size, quality and format set in the URL suffix, e.g. `…jpg_720x720q80.jpg_.webp` and `…png_120x120q80.png_.avif`. Card images get **AVIF/WebP at exact pixel sizes**, with no `srcset` and no native `loading="lazy"` (0 of 132 images). Lazy loading is done in JS instead. Fonts: Noto Sans on the homepage, an icon font on the PDP. Carousels: Swiper (`.swiper` exists, `swiper-icons` font).

---

## Homepage

1. **Search is the header**
   - **Observed:** No logo bar. A full-width search field with an orange "Search" button is pinned at the top, and its placeholder rotates through trending queries ("t shirt", "smart watch", …).
   - **Why it grabs attention:** Search is the main way into a large catalogue, and the rotating placeholders suggest what to type.
   - **How it's built:** `div.homepage-msite-search-wrap`, `position: fixed`, 53px tall (DOM). The trending terms are in the page text before the field.

2. **Two rows of round-cornered "service" icons (10 tiles, paginated)**
   - **Observed:** Square icons for Free Gifts, Everyday Low Price, Freebie, Mall, Beauty, Sale Live, Official Mobile, Buy More Save More, Fast Delivery and New Arrivals, with dots for a second page.
   - **Why it grabs attention:** Each icon promises something (a deal, speed, authenticity) instead of naming a category, and there is one tap per promise.
   - **How it's built:** A Swiper page with 120×120 AVIF/WebP icons.

3. **Campaign banner, then a Flash Sale module, all on the first screen**
   - **Observed:** A wide campaign banner ("10.10" with its date range and a "Shop Now" disc). Below it a **Flash Sale card with a live HH:MM:SS countdown** and three product tiles. Each tile has a diagonal "SAVE xx%" ribbon, the price in red, the struck-through original price, and a **red progress pill with a flame icon reading "2 Stock left" or "34 Sold"**.
   - **Why it grabs attention:** The countdown, the discount ribbon and the scarcity pill all appear on every tile. The first prices are visible at y≈580, with no scrolling.
   - **How it's built:** Leaf text nodes for the countdown digits (7 two-digit spans) that a timer updates. The pill text comes from the API (stock left vs. sold count). It is not a native `<progress>`.

4. **"Popular categories for you": a personalised category rail**
   - **Observed:** A horizontal rail of photo tiles chosen per visitor. The picks were random (projector accessories, washer-dryers).
   - **Why it matters:** Personalisation with almost no history gives poor results. A fixed, curated rail would do better for a single brand.

5. **Sticky deal-filter chips, then an endless "Just for You" feed**
   - **Observed:** A row of icon chips (All, Mega Deals, Voucher, Fast Delivery, Daily Needs…) sticks under the search bar. Under it is an infinite 2-column feed. **Card anatomy:** square image, a small campaign badge ("10.10") placed *in front of* a 2-line title, the price in orange, then **"★ 4.4 (544)"**. There is no struck-through price in this feed.
   - **Why it grabs attention:** Endless browsing with no dead end. The rating count sits on every card, so social proof shows before the click.
   - **How it's built:** `div.jfy-header-fixed` (sticky, 71px tall). Cards are `<div>`s with JS click handlers; the homepage has **only 2 `<a>` elements** in total. JS loads more cards as you scroll.

6. **Bottom tab bar** (Home / Categories / Cart / Account), `nav.h2-tabbar`, fixed, 52px tall. Categories opens a **two-pane browser**: a left rail of departments, and on the right accordions that open into 3-column photo tiles ("Kurtas and Panjabis", "Casual Shirts", …).

### Listing card (on the way to the PDP)
Near-square photo, 2-line title, **"৳ 510 · 58% Off"** on one line, then **"★ 4.4 · 2.3K sold"** and a "Dhaka" origin line. Some cards carry a "BEST PRICE" tag. Quick filter chips at the top: New Arrival, Mall, Free Delivery, Best Price Guaranteed. The listing price (৳510) is the **price after a category voucher**. The PDP shows ৳560 (the tracking parameters carry `voucherPrice:51000` vs. `shopPrice:56000`).

---

## PDP

1. **Full-bleed gallery with a "1/2" counter and floating icons**: a square-ish image fills the first ~390px, with see-through Home, Cart and ⋮ icons over it and no header bar.

2. **Price block before the title**
   - **Observed:** "৳ 640 off with Promo" in pink, then **৳ 560** large and red, then ~~৳ 1,200~~, then a "-53%" chip, then wishlist and share icons. After that a 3-line title and "★ 4.4 (507)".
   - **Why it grabs attention:** The money appears first, phrased as a saving. (We already knew to put the price near the top. What's new here is the **saving-amount line above the price**.)

3. **Summary rows that open bottom sheets**
   - **Observed:** Rows with a chevron: **Product Options** ("Size: Int:38, White"), **Specifications** (field names only), **Delivery** (a default address, "Standard Delivery, Guaranteed by 18–21 Oct", **৳ 90**), **Service** ("14 days easy return, Change of Mind applicable", "Warranty not available").
   - **Why it grabs attention:** The four things a BD shopper checks (variant, delivery date, delivery fee, return policy) fit in one screen as one-line summaries. The detail opens in a sheet only when someone taps it.
   - **How it's built:** Product Options opens a **variant sheet** showing a thumbnail, price and discount again, size and colour pills, a quantity stepper, and its own Buy Now / Add to Cart bar.

4. **Sticky section tabs (scroll-spy)**
   - **Observed:** After you scroll, a tab strip appears under the floating header: **Overview · Ratings · Product details · Recommendations**. The active tab updates as you scroll.
   - **Why it grabs attention:** On a long page, one tap jumps to the reviews.
   - **How it's built:** `div.elevator` (sticky, top 48px, 35px tall) plus `div.fixed-top.scrolling` (48px).

5. **Reviews with buyer photos, then Q&A, high on the page**
   - **Observed:** "Ratings and Reviews (507)", one review with **two customer photos** (shoppers wearing the panjabi), then **"Questions about this product (171)"** with a question in Bengali ("If I order today, when will I get it?") and the seller's answer with an "Answered within 8 hours" stamp, then an ASK QUESTIONS link.
   - **Why it grabs attention:** Real people wearing the product, and an answer to the most common BD worry (delivery time) in the shopper's own language.

6. **Two-button sticky bar: Buy Now + Add to Cart, with Store and Chat**
   - **Observed:** A fixed bottom bar: Store and Chat icons on the left, then **Buy Now** (blue gradient) and **Add to Cart** (orange gradient) side by side.
   - **How it's built:** `div.pdp-mod-cart-concern`, fixed, 51px tall (DOM).

7. **Description = hashtag-heavy "Highlights" bullets, then repeated product photos**, then a "You may also like" rail of near-identical panjabis from the same seller.

**Weight:** homepage ≈165 requests and ≈450KB transferred at load (the feed loads more as you scroll). PDP ≈117 requests and **≈3.0MB**, 39 scripts. Third-party hosts on the PDP: `analytics.tiktok.com`, `connect.facebook.net`, `googletagmanager.com`, `google-analytics.com`, `doubleclick.net`, `pagead2.googlesyndication.com`, plus Alibaba telemetry (`dz.mmstat.com` with 27 beacons, `fourier.alibaba.com`, `px-intl.ucweb.com`). The review widget did load headless.

---

## Weak spots (anti-patterns)

- **Confusing price maths:** the listing shows ৳510 (after voucher) and the PDP shows ৳560, and "৳640 off with Promo" is just the gap to a struck-through ৳1,200 "original" price. This looks like inflated reference pricing, and it erodes trust.
- **No COD mention on the PDP.** The Delivery/Service rows never say "Cash on Delivery" (searched the page text). COD only comes up at checkout.
- **Three app-install prompts** (a top banner, a bottom sheet, a card on the listing page) compete with the CTA.
- **Divs instead of links:** 2 anchors on the whole homepage, so cards can't be long-pressed, opened in a new tab, or followed by crawlers.
- **Hashtags and filler** ("Best Production quality, Unique design") in the highlights; the material reads "Silk" in a "Soft Cotton" title.
- **Two equal-weight CTAs with loud gradients**, and a sold-count/stock pill that mixes two different signals in the same visual slot.
- Heavy telemetry: dozens of beacons per page view.

## Takeaways for our stores

- **Saving line above the price** ("You save ৳640") together with `<Price>` and a struck-through compare-at price, but only when compare-at is a real past price. Fits all three stores, and matters most for punjabi during Eid and Puja sales.
- **PDP summary rows that open sheets:** *Size*, *Delivery* (estimated date range plus fee for Dhaka vs. outside Dhaka), *Returns*, and **Cash on Delivery available**, each on one line. Daraz leaves COD out; we should put it there. All stores.
- **Sticky section tabs** (Details · Reviews · You may like) on long PDPs. Most useful for punjabi, which has long fabric and embroidery descriptions.
- **Bengali Q&A block** with "answered within X hours", and a WhatsApp handoff for new questions. All stores.
- **Review photos up top:** show customer photos first in the reviews block. Punjabi and shirts, where fit and colour shots sell.
- **"★ 4.6 · 120 sold" on cards**, only once the numbers are real and above a threshold. All stores.
- **Flash-sale strip with countdown** on the homepage for real, time-boxed campaigns only (Eid, Pohela Boishakh, 11.11). Punjabi first.
- Image delivery: serve exact-size **AVIF/WebP** variants from our sharp pipeline the way their CDN does, but keep real `<a>` links and `srcset`.

## Measure later (analytics feature)

- Saving line vs. plain struck-through price: PDP → add-to-cart rate.
- Delivery-date + COD summary row: add-to-cart → checkout-start rate; how many sessions tap the row.
- Sticky section tabs: tab taps, and share of PDP sessions that reach reviews.
- Q&A block: question submissions or WhatsApp taps per PDP view.
- Sold count / rating on cards: listing → PDP click-through, by threshold.
- Flash-sale module: clicks per impression, and conversion during vs. after the countdown.

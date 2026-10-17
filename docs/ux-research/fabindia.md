# Fabindia: mobile UX research

- **Site:** Fabindia (reference for the punjabi / ethnic store: men's kurta)
- **URLs analyzed:**
  - Homepage: `https://www.fabindia.com/`
  - PDP: `https://www.fabindia.com/black-cotton-dobby-long-kurta-20312303`, reached by homepage "Men" circle tile → `/men` → "Long Kurtas" tile → `/clothing/men-long-kurtas` → first product (tagged "Bestseller")
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, mobile + touch emulation (CDP `Emulation.setDeviceMetricsOverride`), iPhone iOS 18 Safari UA
- **Method:** REA (`inspect_web_page`, `capture_web_screenshot`) on own headless Chrome (CDP :9226). Scrolling and clicks were driven by CDP `Runtime.evaluate`, plus DOM and `performance.getEntriesByType('resource')` queries. No pop-ups needed dismissing (no cookie banner showed; the app banner was left in place).
- **REA evidence:** homepage inspect `ev_22c33556…0266`, homepage screenshot `ev_5991f554…4bc`, PDP inspect `ev_0480dbca…ec4`, PDP screenshot `ev_314485a9…e44a`. REA filtered third-party origins (`policy_filtered`), so the third-party list comes from resource timing.
- **Region caveat:** From a Bangladesh IP the site serves its international storefront (USD prices, `ipapi.co` geo lookup). Indian-only features (pincode check, INR offers) may differ.

## Homepage

1. **Three stacked top bars: app banner, scrolling message, sticky header**
   - **Observed:** A dismissible "Open App" banner, then a maroon marquee strip promoting the festive collection, then a 60px header (hamburger, globe/country picker, logo, search, wishlist, cart). On scroll the two top strips leave and only the header stays pinned.
   - **Why it grabs attention:** The moving strip is the only motion above the hero, so the festive message gets read. But the three bars use about 140px before any image.
   - **How it's built:** `DIV.header` is `position: sticky`. The globe opens a country/currency selector.

2. **Hero carousel with gender-split campaigns**
   - **Observed:** A 5-slide lifestyle carousel with dots. Each slide is one campaign (festive collection, western wear, festive home, wedding), with a serif headline and one boxed CTA.
   - **How it's built:** Bootstrap carousel. The visible slide images are `loading="lazy"` from SAP Commerce media (`apisap.fabindia.com/medias/…?context=…`), with only a static placeholder `fabindia-mobile-main-banner.webp` loaded eagerly. That hurts LCP.

3. **Circle category chips on a patterned band**
   - **Observed:** Directly under the hero sit 4 large maroon circles (Women, Men, Kids, Home & Living) on a woven-texture background. One row, all visible.
   - **Why it grabs attention:** They read as tappable buttons, not banners, and fit one thumb row.

4. **"Fantastic Finds": price-capped category tiles**
   - **Observed:** A horizontal rail of photo tiles with labels like "Men's Kurtas / Under $49". Each tile links to the category with a **price filter pre-applied** (`priceAfterDiscount:$0-$29…$40-$49`). A second "starting at $X" rail appears for home goods.
   - **Why it grabs attention:** It answers "what can I afford?" before the shopper thinks about it, and the landing grid is already filtered to that budget.
   - **How it's built:** Plain links carrying the SAP search query string plus `promoID` tracking parameters.

5. **Product rail is early, cards are minimal**
   - **Observed:** "Recommended For You" begins about 1,180px down (~1.4 screens): a horizontal rail, about 1.6 cards visible, with a 4:5 image, a 1-line truncated name and the price. There is no badge, swatch, rating or wishlist on homepage cards.
   - **How it's built:** Angular `cx-media` with `aio=w-400` resize parameter. Cards open with `target="_blank"`.

6. **Merchandising themes: "Colour of the Month", gifting, puja, custom kurta**
   - **Observed:** Below the rail come editorial banners: "Colour of the Month: Crimson Hues" (linking to all products filtered by RED, sorted by bestseller), gifting, puja essentials, an "Offers for you" pair (60% off womenswear), and a **made-to-measure "Custom Kurta"** banner.
   - **Why it grabs attention:** A colour theme is a cheap way to refresh the page monthly and cuts across categories.

7. **Persistent WhatsApp button**
   - **Observed:** A green WhatsApp bubble fixed bottom-right on every page, linking to `wa.me/<India number>?text=hi`.
   - **How it's built:** `DIV.whatsapp-icon` with `position: fixed`.

8. **Footer:** "Popular Searches" SEO link cloud, a brand story paragraph, accordions, social icons and app-store badges. The page is short, about 7,800px.

**Platform and performance (homepage):**
- **SAP Commerce Cloud + Spartacus (Angular 19.2)** (`ng-version="19.2.21"`, `cx-skip-link`, `cx-page-slot`, `/medias?context=` URLs).
- Images are JPEG through an `aio=w-<width>` resizer (`server: Nitrogen`). No WebP/AVIF for product shots, and no `sizes` attribute.
- Fonts: Assistant 400/500/600 for body, Playfair Display 600 for section titles.
- 234 resource entries, about 2.3MB encoded body (resource timing; cross-origin entries without TAO count as 0, so it is a floor). 77 scripts.
- Third parties (resource timing): GTM, GA4, Google Ads, Meta Pixel, Snapchat, CookieYes, Netcore Smartech, Unbxd (search), Branch.io, Pingdom RUM, Trackier/Artfut/Preciso affiliates, boxx.ai, LightWidget (Instagram feed), Google Maps.
- The Instagram feed block showed only spinners headless.

## PDP

1. **Gallery: 6 swipeable images, dots only**
   - **Observed:** A 4:5 studio shot of a model on a plain backdrop, 6 dots under it. No thumbnails, video or zoom affordance.
   - **How it's built:** Bootstrap carousel (`data-touch` for swipe). The first image is `loading="eager" fetchpriority="high"`, a 768px JPEG for a 367px slot.

2. **Title → SKU → price "(Incl. of all taxes)" → photo swatches**
   - **Observed:** After the gallery: the name, SKU, the price with a tax note, then **colour swatches made from cropped fabric photos** (Black, Maroon). Each swatch is a sibling product, not a variant.
   - **Why it grabs attention:** A fabric-crop swatch shows the weave and print, which a flat colour dot can't. That matters for dobby, block-print or jamdani-like fabrics.

3. **Size pills with a full-screen size guide**
   - **Observed:** Pill chips XS–XXL, with sold-out XXL struck through. "Size Guide" opens a full-screen sheet with an **inches/cm toggle**, an HTML table (shoulder, chest, waist, hip per size), a how-to-measure body diagram and a note that the brand's sizing runs large.
   - **How it's built:** The table is HTML, so it is readable and translatable. The diagram is an image.

4. **Honest policy lines right under the picker**
   - **Observed:** Three icon rows directly above the spec table: "Cash on delivery is not available", "Free shipping for all orders above $100", "Non-Returnable" + "Read More".
   - **Why it grabs attention:** Shoppers see the deal-breakers *before* the CTA. The negatives are shown honestly (it is the international store).

5. **Spec table opens by default, with model size and dispatch time inside**
   - **Observed:** "Specifications" is expanded: **model height 6'1" wearing size S**, material, pattern, neck, sleeves, fit, length, **occasion**, care, and **"Dispatch Timeline: 10 working days"**. "Description" is a collapsed accordion below.

6. **Sticky dual CTA bar**
   - **Observed:** "Add To Wishlist" (outline) and "Add To Cart" (filled maroon) share a fixed bottom bar from first paint.
   - **How it's built:** `CX-PAGE-SLOT.AddToCart`, `position: fixed`, 60px.

7. **One "Similar Product" rail and no reviews**
   - **Observed:** 12 cards, mostly the same kurta in other colours at the same price. No ratings, reviews or "complete the look".

**SEO (PDP):** There is one `<h1>`, a "Buy … Online at Fabindia" title, `og:image`, and Product + BreadcrumbList + Organization + WebSite JSON-LD. But Product JSON-LD appears **twice**, the canonical points to a different SKU (`…-20312306`), and the meta description claims "COD, Easy returns", which contradicts the on-page "COD not available / Non-Returnable".

## Weak spots (anti-patterns)

- The hero slides are lazy-loaded. Three stacked bars take about 140px before the hero.
- Homepage cards have a 1-line truncated name, no badge, and open in a new tab.
- PDP has no reviews or ratings anywhere, and the only rail is same-style colour variants.
- 768px JPEG for a 367px slot, with no WebP/AVIF and no `sizes`.
- There are 20 or more third-party tags (several affiliate trackers).
- The meta description contradicts the PDP's policy lines. The canonical and the duplicated Product JSON-LD don't match.
- The WhatsApp bubble overlaps card prices and the sticky bar edge on small screens.

## Takeaways for our punjabi store

- **Budget tiles** ("Panjabi under ৳1,500 / ৳2,500 / ৳4,000") that land on a pre-filtered grid. Price is a top filter for BD shoppers, and the tile does the filtering for them.
- **Fabric-crop swatches** for colour siblings (a crop of the actual cloth instead of a flat colour dot), and link sibling products as swatches.
- **Policy lines above the CTA**, shown honestly per product: COD yes/no, exchange yes/no, delivery fee threshold. Use icons and text, translatable to Bengali.
- **Model height + size worn** and **dispatch / ready-in time** as rows inside the spec table.
- **Size guide sheet with an inch/cm toggle**, an HTML table and a "runs large/small" note.
- **"Colour of the month" / occasion merchandising** that links to a cross-category filtered grid. It is cheap to rotate for Eid, Puja and Boishakh (red-white).
- **Made-to-measure / custom panjabi** entry point if our stores offer tailoring.
- A persistent WhatsApp entry, kept clear of the sticky ATC bar and card prices.

## Measure later (with `analytics`)

- Click-through and add-to-cart from budget tiles vs. plain category tiles.
- Swatch taps (fabric crop vs. flat colour dot) and the cross-colour conversion they drive.
- PDP exits after the policy lines are shown (COD/exchange visibility vs. bounce).
- Size-guide opens vs. size-related returns/exchanges.
- Wishlist vs. add-to-cart taps on the dual sticky bar.
- WhatsApp bubble taps per PDP view, and orders that follow.

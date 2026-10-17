# Bata Bangladesh: mobile UX research (reference for our shoes store)

- **Site:** https://www.batabd.com (Bata's official Bangladesh shop)
- **URLs analyzed:**
  - Homepage: `https://www.batabd.com/`
  - Path to the PDP: hamburger menu, then Men, then All Shoes (`/collections/mens-all-shoes`, which defaults to `?sort_by=created-descending`), then the 3rd card.
  - PDP: `https://www.batabd.com/collections/mens-all-shoes/products/bata-men-oakland-mens-casual-1?variant=67693433356656` (a men's casual loafer at Tk 3,999, 20% off Tk 4,999)
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px (CDP `Emulation.setDeviceMetricsOverride`, mobile, DPR 3), iPhone iOS 18 Safari UA, touch enabled
- **Method:** REA (`capture_web_screenshot`, `inspect_web_page`) plus my own headless Chrome over CDP for scrolling, opening the menu and size-chart modal, and DOM/`performance` probes. I saw no cookie, geo or promo pop-up, so I dismissed nothing. I did not add anything to the cart.
- **REA evidence:** homepage screenshot `ev_72ff8d32…`, PDP screenshot `ev_6adb21ee…`, PDP inspect `ev_3dbf2022…` (7,301 DOM nodes). REA's inspect was `policy_filtered` to same-origin data, so the third-party script list and weight figures come from CDP `performance.getEntriesByType('resource')`.

## Homepage

1. **No announcement bar. A 10-slide bank-offer hero instead**
   - **Observed:** Under a plain header (hamburger, search, logo, account, cart) sits a short, 3:2 promo banner carousel with 10 dots. The slides are festival offers and bank-card cashback deals (several banks' logos, "15% / 20% / 25% cashback", reward points).
   - **Why it grabs attention:** For a Bangladeshi shopper, card cashback and festival offers count as a reason to buy *today*. The offer itself is the hero, not a lifestyle image.
   - **How it's built:** `#shopify-section-slideshow` on Slick (jQuery 1.11). Each slide has two `<img>` tags (`slide-pc` 1864px and `slide-mobile` 900px). See Weak spots.
2. **2×2 category tiles straight after the hero**
   - **Observed:** Men's, Women's, Kids', and Accessories pastel tiles, then a gift-voucher banner (with an "EMI available" tag).
   - **How it's built:** `home-top-banner-sections`. These tiles are already known from Aarong and Yellow.
3. **First product at about 0.85 screens (around 720px)**
   - **Observed:** A "Best Seller" two-up Slick carousel starts at 680px, so the first packshots peek above the fold.
   - **Why it grabs attention:** Real products show up sooner than on Allbirds (about 1.3 screens).
4. **Product card that lists available sizes**
   - **Observed:** The card holds a packshot on white, then **a row of in-stock size numbers ("10 9 6", "5 6 7 8 +2")**, then the brand name in caps, the product name (1 line, ellipsis), a struck-through Tk price with the red sale price, a full-width black **"SHOP NOW"** button and a single colour dot. A "Sale" label and a wishlist heart are in the DOM.
   - **Why it grabs attention:** The size row answers the first question a shoe shopper has ("is my size there?") before they tap, which saves dead-end visits to the PDP. The brand line matters because Bata sells many sub-brands (Hush Puppies, North Star, Power, Weinbrenner and others).
   - **How it's built:** `.product-item.image-swap`. It has a second hover image (`.images-two`), lazysizes (`data-srcset`, `data-sizes="auto"`, `_300x` Shopify thumbnails) and `.product-label .sale-label`.
5. **Tabbed "Just Landed" rail**
   - **Observed:** Pill tabs (Casuals, Sneakers, Ladies Flats, Sandals, Formals, Accessories, Sale) switch the product carousel underneath.
   - **Why it grabs attention:** One section can serve several intents without the page getting longer.
   - **How it's built:** `home-new-products-tab-sections` with a horizontally scrollable tab list and an underline progress bar.
6. **Sub-brand spotlight cards, a blog and Instagram**
   - **Observed:** Big editorial cards ("hand-picked collection", one sub-brand each) with a short paragraph and "SHOP NOW", then a "Featured Products" rail, a ladies' bags spotlight, two long blog posts and an Instagram strip.
   - **Why it grabs attention:** The cards work as brand storytelling, but the blog takes up about 760px of mobile space for little purchase intent.
7. **A menu built around how people shop for shoes in Bangladesh**
   - **Observed:** The drawer leads with a red **"DISCOUNTED PRODUCT"** link, then Sneaker Studio, Brands, Men, Women, Children, Accessories, Digital Vouchers and Bata Club (loyalty). The Men section offers **By brand, By colour, By price in Tk bands (Under 1000, 1001–1500 … Above 5000) and By size (5–11)**. Below the links are WhatsApp, Wishlist, Find a Store and a customer-care phone number.
   - **Why it grabs attention:** Price bands in local currency and shop-by-size match how budget-led BD shoppers filter. WhatsApp and a hotline in the menu are trust signals that work locally.
   - **How it's built:** The filters are collection URLs with `?constraint=` tags (`/collections/men?constraint=tk-1001-tk-1500`, `?constraint=8`).
8. **Sticky elements:** a 50px `header-bottom` stays fixed, and there is a floating back-to-top circle at bottom-right. There is no sticky offer or cart bar.

## PDP

1. **Gallery first, with thumbnails**
   - **Observed:** Breadcrumb with prev/next-product arrows, then the main packshot on white, then a strip of 5 thumbnails with arrows. There is no video or 360 view, and no dots.
   - **How it's built:** Slick `slider-for` / `slider-nav` (5 slides), images at `_1024x1024` (1000px natural), and a Fancybox lightbox for zoom.
2. **Spec-style header: Brand, Product Code, Availability**
   - **Observed:** The H1 is in caps, followed by a 3-row key/value block: "Brand", "Product Code", "Availability: In stock". Then a struck-through price, the red sale price and a **red "-20%" chip**.
   - **Why it grabs attention:** The percentage chip makes the saving obvious at a glance. "In stock" answers availability before size selection.
3. **"Check the product in front of the delivery man" line**
   - **Observed:** Right under the price, in red: a line telling buyers to check the product in front of the delivery person, plus "offer valid only on the website".
   - **Why it grabs attention:** In a market where most orders are cash on delivery, the promise that you can inspect before you accept is a strong trust cue, and it sits right next to the price. The Terms accordion expands on it: mismatched size or a damaged product can be refused at the door.
4. **Size circles, colour swatch and size chart**
   - **Observed:** Round size buttons 6–10 (**size 6 was pre-selected**, so I couldn't see a "select a size" state). Then a single colour swatch and a "SIZE CHART" link with a ruler icon. The chart is a **static image** with Men/Women/Children tables mapping Bata size to inches, cm, EU, UK and US.
   - **Why it grabs attention:** Mapping to foot length in cm and inches lets shoppers measure at home. Many BD customers know their "Bata size", so it works as a local standard.
   - **How it's built:** `.swatch-element.size.available` radios. The chart opens in a Bootstrap `halo_modal-custom`. A `size-charts-relentless.herokuapp.com` app script also loads.
5. **Quantity, live subtotal, Add to Cart plus Buy It Now**
   - **Observed:** A quantity stepper, a "Subtotal: Tk 3,999" line, a black "ADD TO CART" with a heart wishlist button beside it, then an outlined "BUY IT NOW".
   - **Why it grabs attention:** The subtotal confirms the total before commitment. Buy It Now skips the cart for impulse buys.
6. **Sticky add-to-cart with a variant dropdown**
   - **Observed:** Once the inline CTA scrolls off, a 96px bottom bar shows a `<select>` reading "6 / Blue / #MPC#701 – Tk 3,999" above "ADD TO CART".
   - **How it's built:** `.sticky_form`, `position: fixed`. The sticky bar itself is already known, but the variant `<select>` inside it is new: size can be changed without scrolling back up.
7. **Description:** an accordion that opens with a paragraph, then a "FEATURES" key/value list (upper material, insole, outsole, closing), then "Tips" for use and care. A "Terms and Conditions" accordion follows, then a "Related Products" carousel (10 items, same card with sizes) and a dark accordion footer (call hours, email, Visa/Mastercard/Amex icons).

### How it's built (both pages)

- **Platform:** Shopify with the **Cospora 3.0.0** theme (`Shopify.theme.schema_name`). The store is a copy of an older theme ("Copy of Bata Bd – Club Page"). It runs jQuery 1.11, Slick, lazysizes, Fancybox and Bootstrap modals.
- **Images:** Shopify CDN, old-style `_300x` / `_1024x1024` suffixes, JPG. The homepage has 151 images, 127 lazy and 106 with srcset.
- **Fonts:** Montserrat (Google Fonts), Arimo and Font Awesome.
- **Third parties:** GTM/GA4, Google Ads, Meta pixel, TikTok pixel, Microsoft Clarity, **Ptengine** (heatmaps), SumoMe, Avada tag manager, ScopeMedia, the size-chart app, Shopify web-pixel sandboxes and an AMP script.
- **Weight (CDP `performance`):** homepage 425 requests / ~1.0 MB transferred, DOMContentLoaded 2.6 s, load 4.2 s. PDP 402 requests / ~0.5 MB (warm cache), load 3.0 s.

## Weak spots (anti-patterns)

- **All 20 hero images load on mobile:** both the 10 desktop slides (1864px) and the 10 mobile slides, with none lazy. That is wasted bytes on BD mobile data.
- **Ten offer slides** is too many: nobody sees slides 4–10, and the dots are tiny.
- **No reviews or ratings anywhere.** `shopify-product-reviews-badge` placeholders render empty, and the JSON-LD has no `aggregateRating`. JSON-LD `Product` is also output twice.
- **"Promocode" shown as a required product option.** An internal campaign code (`#MPC#701`) is a third variant option. It also leaks into the sticky dropdown label, which is confusing.
- **Size pre-selected by default:** customers can add the wrong size without making a choice.
- **The size chart is a tiny image** that can't be read at 390px without pinch-zoom, and is not accessible.
- **Women/Kids tiles link to `batabd.myshopify.com`**, so customers jump domains.
- **Description shown twice** (an excerpt above the size picker, then the full text in the accordion). The excerpt has run-together text ("Type: ShoeGender: Men").
- No delivery-time or delivery-fee info near the CTA. Return/exchange terms are hidden in an accordion.

## Takeaways for our shoes store

- **Show in-stock sizes on product cards** ("6 7 8 +2") so customers see their size is there before tapping.
- **Put a COD trust line next to the price:** "Check before you pay: open the box in front of the courier", with a link to the policy. It is a local trust signal that fits our COD/WhatsApp flow.
- **Discount % chip** beside the struck-through price, using `<Badge>` with `--color-accent`.
- **Shop by size and by Tk price band** in the mobile menu and filters, not only by category.
- **Size chart with foot length in cm/inches** plus EU/UK/US, as a real HTML table in a `<Modal>`, not an image. Include a "how to measure" step.
- **A variant switcher inside the sticky ATC bar**, so size can change without scrolling up.
- **Tabbed product rail** on the homepage (Casual / Formal / Sandal / Sneaker) to keep the page short.
- **Brand line on cards** if we carry several labels.
- Card-offer and festival offers belong in a single slim strip, not a 10-slide hero. Never pre-select a size.
- Technical: `next/image` art direction with `sizes` and no hidden eager images; render JSON-LD once.

## Measure later (with `analytics`)

- Click-through rate on cards that show a size row vs cards without one, and PDP bounce rate from those clicks.
- Add-to-cart rate with vs without the COD "check before you pay" line near the price.
- Menu usage: shop-by-size and price-band taps vs category taps.
- Size-chart opens, and the return/refusal rate for wrong size afterwards.
- Variant changes made inside the sticky ATC bar.
- Hero slide impressions by slide index (to prove that slides past 3 go unseen).

## Not observed

- A sold-out size state (every size of this product was available) and a "select a size" error state (a size was pre-selected).
- Reviews: no review widget exists on the site.
- Store-level stock ("Find a Store" is a link only). Cart, checkout, delivery-fee and EMI flows were not opened.

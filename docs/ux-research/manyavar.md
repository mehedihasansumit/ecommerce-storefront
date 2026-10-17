# Manyavar: mobile UX research

- **Site:** Manyavar (reference for the punjabi / ethnic store: men's kurta and festive/wedding wear)
- **URLs analyzed:**
  - Homepage: `https://www.manyavar.com/` (geo-redirects to the "Rest of World" store `https://www.manyavar.com/en-gg`, USD)
  - PDP: `https://www.manyavar.com/en-gg/medium-length-kurta/mustard-yellow-mid-length-kurta/UC146092.html`, reached by the menu link "Kurta" → `/en-gg/men/only-kurta` → second product (tagged "PUJA SPECIAL")
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, mobile + touch emulation, iPhone iOS 18 Safari UA
- **Method:** REA (`inspect_web_page`, `capture_web_screenshot`) on own headless Chrome (CDP :9226). Scrolling and clicks were driven by CDP `Runtime.evaluate`, plus DOM and `performance` resource-timing queries. **Pop-ups dismissed by script:** the cookie bar (tapped "Decline") and a Google One Tap sign-in sheet.
- **REA evidence:** homepage inspect `ev_98f724cd…868f`, PDP inspect `ev_83554840…74e4`, PDP screenshot `ev_eccf57aa…ae2f73`. REA filtered third-party origins (`policy_filtered`), so the third-party list comes from resource timing.
- **Not observable:** The hero is an HLS video, which headless Chrome couldn't play ("media could not be loaded"), so I saw only its poster and controls. The "Calculate Size" fit tool (SizeNFit) didn't open in my scripted tap.

## Homepage

1. **Rotating trust/announcement bar**
   - **Observed:** A thin dark strip that cycles between "Free shipping above 70 USD", "Trusted by millions since 1999" and "Celebration wear of assured quality".
   - **How it's built:** A slick slider (`flashbar-nav-slider`).

2. **Full-screen video hero under a transparent header**
   - **Observed:** A full-height, muted, autoplay video of a couple at a wedding, with a sound toggle and two CTAs: "WATCH NOW" and "SHOP NOW". The header (menu, logo, search, account with badge, wishlist, cart) sits transparent over it and turns solid on scroll.
   - **How it's built:** video.js (`vjs-tech`) playing an Adobe Scene7 `.m3u8` stream. The poster is a Scene7 image sized `wid=390&hei=844`. `HEADER.home-transparent` is `position: sticky`.

3. **"Let's find your look": a persona picker**
   - **Observed:** A 5-slide carousel titled "What's special today?" Each slide is a person in the outfit, with an orange pill CTA for the current persona ("I'm The Groom") and the other personas listed faintly below it: Attending a Wedding, The Bride, Team Bride, Celebrating a Festival.
   - **Why it grabs attention:** It asks "who are you at this event?" instead of "which category?". One tap lands on an occasion-ready edit, and the faint list shows the other options without a menu.
   - **How it's built:** Slick carousel. Slide images are Scene7 presets (`$WT_HP/MLP/WLP_Hero_M$`, 750px for a 390px slot) with `fetchpriority="low"`.

4. **"What's your vibe?": arch-shaped style tiles**
   - **Observed:** A horizontal rail of tall tiles with an arched top (temple/jharokha shape), each labelled with a style (Sherwani, Indo Western…).
   - **Why it grabs attention:** The arch shape makes it feel ethnic without adding any extra copy.

5. **"Shop the occasion": tabbed 2×2 grid**
   - **Observed:** Men/Women tabs over a 2×2 grid of occasion tiles (Wedding, Reception, Engagement, Sangeet). A second page is reached with dots. The menu adds more occasions: Haldi, Durga Puja, Navaratri.
   - **How it's built:** Occasion is a search facet (`prefn1=shopByOccasion&prefv1=Wedding`), so the tiles and the filter use the same data.

6. **First product appears late: "Most Loved" tabbed rail**
   - **Observed:** The first product card is at about **3,600px** (about 4.3 screens), in a Men/Women/Kids tabbed rail with one large card (about 300px wide, 5:7 image). The card has a wishlist heart, a **merchandising tag pill** ("Quiet Luxury"), a 1-line name and the price. A "Sold Out" overlay link is in the markup for every card.
   - **How it's built:** SFCC `product-tile` with a lazy Scene7 image `:283x395?dpr=on,2`.

7. **Customer testimonials with the customer wearing the product**
   - **Observed:** "Testimonials" shows an arched photo of a real groom in his outfit, with a 3-line quote, the customer's name and a 1/3 counter.
   - **Why it grabs attention:** It is social proof that also shows the product being worn.

8. **One-at-a-time trust carousel + chatbot persona**
   - **Observed:** A trust carousel shows one icon at a time: Empowering Weavers, Made in India, Assured Quality, Secure Payments. A round **illustrated-avatar chat bubble** with a green "online" dot sits bottom-right on every page, with a back-to-top arrow above it.
   - **How it's built:** The chat is Yellow.ai (`cdn.yellowmessenger.com`, `#ymDivBar`). There is no WhatsApp link.

**Platform and performance (homepage):**
- **Salesforce Commerce Cloud (SFRA)** (`/on/demandware.static/…`, `Sites-manyavar-row-Site`), jQuery + slick, and Bootstrap grid classes.
- Images and video come from **Adobe Scene7** with named presets and `dpr=on,2`. There is no `srcset`/`sizes`. The format follows Scene7 auto-negotiation.
- Fonts: Figtree 400/500/600 for UI, Rufina for serif display titles, plus Rubik and FontAwesome.
- 148 resource entries, about 1.1MB encoded (resource timing floor, excluding the video stream), before scroll-loaded sections.
- Third parties (resource timing): Adobe Launch/Analytics (`assets.adobedtm.com`, `adobedc.net`), Salesforce Einstein (`cquotient.com`), MoEngage, Criteo, Microsoft Clarity, Bing UET, GTM/GA4/Google Ads, Meta Pixel, Cloudflare Insights, Google One Tap + Sign in with Apple, ipify (geo IP), Yellow.ai, and an `openai.com`-hosted tag.
- `<html lang="en">` with English only. Currency is USD for the rest-of-world store.

## PDP

1. **Gallery: 6 slides, dots, full-screen zoom, and a "Bundle the Look!" chip**
   - **Observed:** A 13:18 lifestyle image on a warm backdrop, 6 dots, a back arrow, and an orange **"+ Bundle the Look!" chip overlaid at bottom-left**. The DOM also holds a "Product Highlights" panel (colour, material, work, items included, wash care) tied to that overlay. My scripted tap did not open it.
   - **How it's built:** Slick (6 real slides plus clones). The first slide is `eager` + `fetchpriority="high"`, a 1300×1800 image for a 390px slot. Full-screen and zoom containers (`fullScreenImageGalleryMobile`, `zoomedImagesMobile`) are pre-mounted.

2. **Title and price on one row, festival tag under it**
   - **Observed:** The name (2 lines) sits on the left and the price on the right of the same row, followed by a "PUJA SPECIAL" pill, the SKU and large round colour-variant swatches.

3. **Size boxes with a per-size stock count and "notify me" for sold-out sizes**
   - **Observed:** Square size boxes S…04XL. In-stock low sizes have a red **"3 Left" / "2 Left" tag under the box**. Sold-out sizes (S, M, XXL…) are greyed **with an envelope icon**: tapping one starts a back-in-stock request instead of being a dead end. "Size Chart" and "Calculate Size" (with an "AI" badge) links sit on the label row.
   - **How it's built:** The sold-out boxes are `a.size-selector-box.notifymejs`. The size chart is a modal with an IN/CM toggle and 4 tables (chest, shoulder, front length, neck, waist, hip, sleeve by size), plus a how-to-measure guide for this kurta length. "Calculate Size" loads `sizenfit.com`.

4. **Urgency + ATC + delivery promise in one block**
   - **Observed:** In order: a pink banner "12 people have viewed the product recently"; wishlist and share icons beside an orange "ADD TO CART"; icons for free delivery above 70 USD and Assured Quality; then **"Deliver to – Dhaka 1000 · EDIT"**, pre-filled from IP, and **"Delivery within 16 days. 83.75% orders last week arrived earlier than expected."**
   - **Why it grabs attention:** The delivery promise comes with a *measured on-time statistic*, which makes the estimate believable. The location is pre-filled, so it costs no effort.

5. **"Bundle the Look" inline cross-sell with one button**
   - **Observed:** "Effortlessly Styled: Bundle the Look!" shows a dashed box with the matching pajama and Nehru jacket, each with a "+" toggle and price, and one "ADD BUNDLE" button.

6. **Sticky ATC that appears only when the inline one scrolls away**
   - **Observed:** A full-width orange "ADD TO CART" bar is fixed at the bottom, hidden while the inline ATC block is on screen. On PDP the header also hides on scroll down.
   - **How it's built:** `DIV.pdp-sticky-footer`, `position: fixed`.

7. **Accordions and rails**
   - **Observed:** Product Details, Product Declaration and Shipping & Returns accordions. Then "You May Also Like" (single large card), **text chips "Similar Medium Length Kurta" / "Similar Yellow Colour"** that jump to filtered grids, and "Complete the look" with **Footwear / Lower tabs**, each card with its own ADD TO CART (sold-out ones flagged).
   - **Trust:** "Trusted since 1999 – Why India Chooses Manyavar Kurtas" carries 5-star quotes from Google reviewers (name, city). These are category-level, not reviews of this product. There are no product ratings, and no `aggregateRating` in JSON-LD.

**SEO (PDP):** Product JSON-LD with offers (USD, InStock) and BreadcrumbList. There are two identical `<h1>`s and no `og:image`. The title is keyword-stuffed with country names.

## Weak spots (anti-patterns)

- The first product is about 4.3 screens down. A video hero, persona carousel, vibe tiles and spotlight banner all come first.
- Cookie bar, Google One Tap and the chat avatar all compete with the hero on first load.
- A stale hero slide (alt "I'M CELEBRATING HOLI" in October) and an unrendered template string as an image alt (`${Resource.msg('global.storename'…)}`).
- 1300px gallery images and 750px banners for a 390px slot, with no `srcset`/`sizes`. Banner images are `fetchpriority="low"`.
- Single-card rails show only one product at a time.
- "12 people viewed" urgency without real reviews on the product.
- About 20 third-party tags, including two sign-in SDKs on first paint.

## Takeaways for our punjabi store

- **Persona/occasion picker** ("I'm the groom", "Going to a wedding", "Eid", "Puja", "Boishakh") as a homepage block, backed by an `occasion` product attribute that also works as a filter.
- **Per-size stock tag** ("২টি বাকি / 2 left") under each size chip, and **"notify me" on sold-out sizes** instead of a dead struck-through chip. It captures demand and gives a reason to come back.
- **Delivery estimate with a pre-filled district** (Dhaka/Chattogram from the address book or IP), and an *honest on-time stat* once we have the data.
- **Bundle the look**: a panjabi + pajama + koti box with toggles and one "Add bundle" button. It raises order value.
- **Complete-the-look tabs** (Pajama / Koti / Nagra shoes) with an add-to-cart on each card. Our shoes store can feed the footwear tab.
- **"Similar fabric / Similar colour" text chips** that link to filtered grids. They are cheap to build from attributes.
- **Customer photo testimonials** (a real customer wearing the product, with name and city) on the homepage.
- **Festival tag pill** ("Eid Special") on cards and PDP, driven by a product tag.
- Show the sticky ATC only once the inline CTA has left the viewport.

## Measure later (with `analytics`)

- Persona-picker taps and the conversion of those sessions vs. category-tile sessions.
- Notify-me requests per sold-out size, and the restock conversion.
- Add-to-cart rate on low-stock sizes with vs. without the "N left" tag.
- Bundle attach rate and order value with vs. without "Add bundle".
- Complete-the-look tab clicks and cross-store (shoes) add-to-cart.
- PDP→checkout rate when a delivery estimate is shown, by district.
- Scroll depth to the first product row (late vs. early products).

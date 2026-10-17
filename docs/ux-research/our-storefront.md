# Our storefront: mobile UX teardown (step 3 baseline)

- **Site:** our multi-tenant Next.js storefront (branch `feat/ux-attention`), local dev server on port 3100
- **URLs analyzed:**
  - Shoes World: `http://shoes.localhost:3100/` and PDPs `/products/air-runner-pro` and `/products/classic-leather-boot`
  - Punjabi Palace: `http://punjabi.localhost:3100/` and PDPs `/products/royal-blue-cotton-punjabi` and `/products/embroidered-silk-punjabi` (the second one was checked in Bengali)
  - Shirts Hub: `http://shirts.localhost:3100/` and PDP `/products/classic-white-oxford`
- **Date:** 2026-10-16
- **Viewport / UA:** 390×844 CSS px, DPR 2, mobile + touch emulation (CDP `Emulation.setDeviceMetricsOverride` + `setTouchEmulationEnabled`, held open by a holder process), iPhone iOS 18 Safari UA. Desktop pass at 1280×800, DPR 1, no UA override.
- **Method:** I ran my own headless Chrome on port 9231 and drove it with small CDP scripts: navigation, DOM and `performance` probes, `PerformanceObserver` for LCP, `Page.captureScreenshot`, and taps (open the variant sheet, pick a size, add to cart, switch to বাং). REA `inspect_web_page` (with accessibility text) and `capture_web_screenshot` provided a11y evidence. I read the source to explain how each part is built and to find the exact file:line of each gap.
- **REA evidence:** shoes PDP inspect `ev_dbef22ab…ffd123` (a11y tree), punjabi homepage screenshot `ev_a6158b4c…730c3`, target list `ev_2d02a7a9…e29c`. REA kept first-party data only (`policy_filtered`). That is not a limitation here because there are no third parties.
- **Caveats:**
  - **Product images are generated placeholders** (flat silhouettes marked "PLACEHOLDER"). I judged layout, hierarchy and behaviour, not photography.
  - **The seed has no hero banners** (`heroBanners[].image = ""` in `src/db/seed.ts:72,113,154`), so `HeroBanner` renders nothing on any store. I assessed the hero from source only.
  - **Seed categories have no images**, so the category circles are empty grey discs.
  - Seed prices are USD-like (`129.99`) even though the UI shows ৳.
  - Seed products carry `averageRating`/`reviewCount` but no review rows.
  - Seed stores have no `socialOrdering` (WhatsApp/Messenger) configured.
  - All weight and timing numbers are from **`next dev`** (unminified, HMR client). They show proportions, not production numbers.

---

## Homepage

The layout is the same on all three stores. Only theme colours and fonts change (Shoes: green/Poppins; Punjabi: maroon + saffron/serif display; Shirts: dark/sans).

1. **No announcement bar, no hero (seed), header with logo + language pill + theme toggle + login**
   - **Observed:** A 64px sticky header holds the store name (text logo), an EN / বাং segmented pill, a dark-mode toggle and a login icon. There is no search and no cart icon in the header on mobile; both live in the bottom tab bar. With no banners in the seed, the page opens straight onto the trust grid. There is no `<h1>` on the homepage on any store (DOM probe: `h1: []`).
   - **Assessment:** *Weak.* Header chrome is minimal, as at Yellow and Allbirds, which is good. But the theme toggle uses one of only three header slots, while every reference spends them on search, cart or wishlist. A missing `h1` is an SEO and a11y miss: Aarong has the same flaw, the others don't. `AnnouncementBanner` exists in the layout, but nothing was seeded into it.
   - **How it's built:** `src/app/(storefront)/layout.tsx:17-22` (AnnouncementBanner → Header → main → Footer → MobileBottomNav → FloatingCallButton). Header is `sticky top-0` (`src/shared/components/storefront/Header.tsx:112`). Cart and search are `hidden md:flex` (`Header.tsx:210,219`).

2. **Hero carousel (source only): 512px tall, 7s auto-advance, eager first slide**
   - **Observed (code):** The default `slider` layout is `h-[32rem]` (512px, about 61% of an 844 screen) on mobile. Slide 1 gets `priority` (eager + `fetchpriority=high`) with `sizes="100vw"`. It has swipe handlers, prev/next buttons and a progress bar. Each banner is one link labelled with its title. There are 5 layouts: slider, split, centered, minimal, grid.
   - **Assessment:** *Good LCP handling, weak height.* We already do what Aarong, Fabindia and Gymshark get wrong: the first slide loads eagerly with priority, and only one image is used, not hidden desktop + mobile pairs as at Allbirds and Bata. But a 512px hero plus the trust grid would push the first product to about **1,350px (1.6 screens)**, which is later than Ecstasy, Sailor, Bata and Daraz (first screen). The rotation has no pause control (Gymshark has one).
   - **How it's built:** `src/shared/components/storefront/HeroBanner.tsx:11` (`AUTO_ADVANCE_MS = 7000`), `:241` (height), `:260-267` (`StoreImage priority={i === 0} sizes="100vw"`). Page wiring: `src/app/(storefront)/page.tsx:61-66`.

3. **Trust grid: 4 tiles in 2×2 directly under the header**
   - **Observed:** Free Shipping / Secure Payment / Easy Returns / 24/7 Support, each with an icon in a tinted square, about 290px tall in all (y≈104–394 including padding). At 390px the copy is **truncated**: "Secure Payme…", "On orders over ৳5…", "100% secure chec…", "30-day return pol…".
   - **Assessment:** *Right idea, wrong execution.* The trust line near the top is the pattern Yellow and Allbirds use (Yellow: exchange window, free shipping, delivery time). But ours takes about a third of a screen, cuts its own claims off mid-word, and is **the same hard-coded copy for every tenant** ("30-day return", "over ৳500", "24/7"). None of it reads the store's real `refundPolicy.windowDays` or `deliveryConfig`. That is the Fabindia mistake: the meta description promised what the page denied. It also leaves out what BD shoppers check first: **COD** and the **inside/outside Dhaka fee**.
   - **How it's built:** `src/app/(storefront)/page.tsx:69-118`. The `truncate` classes are at `:111-112`. The copy comes from `messages/en.json` (`home.freeShippingDesc` = "On orders over ৳500", `home.easyReturnsDesc` = "30-day return policy") with English `||` fallbacks in the TSX.

4. **"Shop by Category": large section header + small round chips**
   - **Observed:** A "● COLLECTIONS" eyebrow pill, a 30px "Shop by Category" H2, a subtitle, then a horizontal row of **80px circles** with a label under each, then a centred "View All →". The section spans y≈394–720 (about 330px) for 3 small circles. The circles are empty here (no seed images).
   - **Assessment:** *Weak.* Most of the section is heading, not tiles. Aarong, Yellow, Bata and Sailor use **large 2-column photo tiles** of a person wearing the category. Fabindia's circles work because they are big and are the whole band. Our 80px chips with `object-contain p-2` will look like icons even with real photos. Nothing filters by budget (Fabindia's "under ৳X") or occasion (Manyavar, Gymshark).
   - **How it's built:** `src/app/(storefront)/page.tsx:121-199`. Circle size `w-20 h-20` at `:170`, image `sizes="96px"` + `object-contain p-2` at `:172-178`. Section padding `py-12 md:py-20` at `:122`, header margin `mb-10 md:mb-14` at `:123`.

5. **First products sit just below the fold, under the bottom bar**
   - **Observed:** The first product card starts at **y≈826–842px (0.98–1.0 screens)** on all three stores. The fixed bottom nav covers y 787–844, so **no product image or price is visible on the first screen**. The only ৳ in the first screen is the truncated "On orders over ৳5…". With a real hero this becomes about 1.6 screens.
   - **Assessment:** *Weak, but close.* We are better than Aarong (3 screens), Uniqlo (3.4), Manyavar (4.3) and the product-free Yellow, Zara and Gymshark, and level with Allbirds (1.3) and Fabindia (1.4). We are behind Ecstasy (y≈540), Sailor (y≈655), Bata (y≈720), Daraz (y≈580) and Nike (y≈650). All of the gap comes from the oversized trust grid and category header. The products themselves are fine.
   - **How it's built:** The sections stack with no rail directly under the hero: `page.tsx:202-239`.

6. **"New Arrivals" and "Featured Products": two identical 2-up grids**
   - **Observed:** Each section has a 30px H2 + subtitle (`mb-10`), a 2-column grid of square cards, and a full-width brand "View All" button. With the seed, **both grids show the same 2–3 products**, because every product is both new and featured.
   - **Assessment:** *Mixed.* A 2-up grid with the price always visible is right: it is what the Aarong report asked for, unlike Aarong's and Nike's name-less cards. But the sections don't dedupe, use no tabs or chips (Bata's "Just Landed" tabs, Sailor's audience chips) and no swipe rail. Two near-duplicate sections make the page long without adding choice.
   - **How it's built:** `page.tsx:46-50` fetches `getFeatured` and `getNewArrivals` independently (`src/features/products/service.ts:62-68`). `ProductGrid` is `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (`src/features/products/components/ProductGrid.tsx:25`).

7. **Product card anatomy**
   - **Observed:** A bordered card with a **1:1** image. Top-left: a red "-22%" pill (or "New"). Top-right: "★ FEATURED". Then a 2-line name, 5 stars + "(15)", then the price in the store's `--color-price` with the struck-through compare-at price. A hover-only "View Details" overlay can't be used on touch. Out-of-stock shows a dark "Out of Stock" pill over the image. "Only N left" appears when stock ≤ 5. The image request is the `w400` variant via `srcset`, `loading=lazy`, `sizes="(max-width:640px) 50vw…"` for a 171px slot. That size is right.
   - **Assessment:** *Good base.* Name, price, compare-at, discount %, rating and count are all on the card, which is more than Aarong, Nike, Fabindia, Zara or Yellow show. Uniqlo and Daraz show the rating; we already do. Missing compared with the references:
     - in-stock **size range / sizes** (Bata, Uniqlo)
     - colour **swatches** (Yellow, Allbirds, Uniqlo)
     - **quick add** (Yellow, Zara, Gymshark, Allbirds on "You may also like")
     - wishlist heart (most references)
     - a 4:5 portrait ratio for apparel (Yellow, Fabindia, Sailor, Gymshark). Square works for shoes (Allbirds, Bata) but crops punjabi length.

     The "FEATURED" badge is noise to a shopper: it is an internal merchandising flag. Two badges per card is also crowded.
   - **How it's built:** `src/features/products/components/ProductCard.tsx:38` (`aspect-square`), `:46` (sizes), `:60-78` (discount/New badges; "New" is hard-coded English), `:82-92` ("★ Featured", hard-coded), `:104-115` (hover-only overlay), `:153-158` (`৳{price.toLocaleString()}`, which bypasses `<Price>`), `:161-165` ("Only {n} left", hard-coded English).

8. **Newsletter block with decorative "social proof"**
   - **Observed:** A large brand-coloured panel, about 1,000px tall on mobile, with "Stay in the Loop", **four plain coloured circles posing as subscriber avatars** and "Join 2,000+ subscribers", then an email + phone form.
   - **Assessment:** *Weak.* It is the longest block on the page, and its social proof is fake. The "2,000+" is a translation string, not a count. This is the kind of made-up signal the Yellow and Gymshark reports warned BD shoppers distrust. Allbirds, Aarong and Sailor keep signup in the footer.
   - **How it's built:** `page.tsx:281-409`. The fake avatars are at `:345-362` (`bg-pink-300` etc.), and `tr("subscriberCount") || "Join 2,000+ subscribers"` is at `:360`.

9. **Bottom tab bar + floating call button**
   - **Observed:** A fixed 57px bar holds Home / Products / Search / Cart (with count badge) / Track Order (Account when logged in), with text labels. A round brand-coloured **phone** FAB, with a pulse animation, sits at bottom-right, above the bar. It is a `tel:` link and is hidden on PDPs.
   - **Assessment:** *Good.* The app-style bar with labels is what Sailor and Daraz do, and our labels fix Sailor's unlabelled icons. "Track Order" as a primary tab suits BD COD buyers. But the FAB is **call only**: no WhatsApp/Messenger chat entry, which is what Sailor, Fabindia and Ecstasy offer and BD shoppers expect. The FAB also pulses forever, which breaks the spec's "never animate on every state change" spirit.
   - **How it's built:** `src/shared/components/storefront/MobileBottomNav.tsx:273` (fixed bar). The "Search" label is hard-coded English at `:114`. `FloatingCallButton.tsx:24-26` (hidden on PDP), `:31` (position), `:42` (`tel:`), `:47` (`animate-pulse`).

10. **Footer:** brand line, quick links, customer-service policy links, contact (address, email, phone), and payment chips (VISA, Mastercard, bKash, Nagad) as text pills, not one image (better than Yellow and Ecstasy). It has no app badges or social links in the seed.

**Page weight / performance (homepage, `next dev`):**

| Store | Requests | Decoded | DCL | LCP element |
|---|---|---|---|---|
| Shoes | 43 (28 scripts) | ≈6.0MB, almost all dev JS | 1.2s | "Shop by Category" H2 text, 1.45s |
| Punjabi | 40 | ≈6.0MB | 2.1s | same H2 text, 2.4s |
| Shirts | 38 | ≈6.0MB | 1.0s | same H2 text, 1.1s |

- Product images are about 2–3KB each (placeholders, `w400` WebP via `srcset`).
- **No third-party tags at all.** Every reference loads 15–30 trackers. This is our biggest structural performance advantage, and we should keep it.
- No horizontal overflow (`scrollWidth` 390), unlike Gymshark's 398px collection page.

---

## PDP

The layout is the same for all three stores. Measurements are from the 390px viewport.

1. **Breadcrumb, then a square gallery with a 5-column thumbnail strip**
   - **Observed:** Breadcrumb Home › Products › name (y≈100). A **358×358 square** main image (y 144–502), then 3 thumbnails in a `grid-cols-5` row (y≈518). On top of the main image sits a pill that reads **"Hover to zoom · Click to expand"**, shown on a touch phone and in English even in বাং. **There is no swipe on the main image**: images change only by tapping thumbnails. There are no dots or counter. The expand button is `opacity-0` until hover, so it is invisible on touch. Tapping the image does open a full-screen lightbox with a counter, keyboard arrows and wheel zoom.
   - **Assessment:** *Weak on mobile.* Every reference gallery swipes (Allbirds, Nike, Gymshark and Uniqlo use native scroll-snap), and most show a position cue ("1 / 9" at Yellow and Uniqlo, dots at Allbirds and Fabindia). The hover hint is wrong on touch and untranslated. Square suits shoes (Allbirds, Bata) but cuts off a full-length punjabi or shirt. Apparel references use 4:5 or 3:4. The breadcrumb skips the category level (Home › Category › Product is what Aarong, Bata and the CLAUDE.md SEO spec ask for).
   - **How it's built:** `src/features/products/components/ProductImageGallery.tsx:143` (`aspect-square`), `:145-154` (mouse-only hover zoom + click), `:182` (hover-only expand), `:189-192` (hard-coded hint), `:196-223` (thumbnails, `grid-cols-5`). There are no touch handlers in the main viewer. Breadcrumb: `src/app/(storefront)/products/[slug]/page.tsx:77-89`.

2. **Main image is the full original, eager + high priority**
   - **Observed:** The main `<img>` is the 1200×1200 original (`…/1af711c4ee0fbdc1.webp`, no `-w800`) with **no `srcset`**, in a 358px slot (DPR 2 needs about 716px). It is `loading=eager fetchpriority=high`, and it is the LCP element (1.6–1.9s in dev).
   - **Assessment:** *Half right.* The priority is correct: Gymshark and Aarong lazy-load their LCP image, and we don't. But `fullRes` sends the original to the phone for hover-zoom that phones can't use. With real 4000px uploads that becomes Yellow's 2–4MB-per-image mistake, even though `sharp` already makes `w400/w800/w1200/w2000` variants.
   - **How it's built:** `ProductImageGallery.tsx:157-166` (`priority fullRes sizes="(max-width: 1024px) 100vw, 50vw"`). `StoreImage.tsx:113-122` drops the `srcSet` when `fullRes`.

3. **Title → rating → price block starts at about 0.78 screens, and the sticky bar covers the inline price**
   - **Observed:** A "Save 19%" pill (y≈620), then the H1 (y≈663), stars + "(28 reviews)" (y≈709), then the inline price "৳129.99 ~~৳159.99~~" at **y≈745**. That is exactly where the **sticky buy bar sits (y 724–787)**, so on the first screen the inline price is hidden and the price is visible **only in the sticky bar**. Then come the short description, "● In Stock (60 available)" with a pulsing dot (y≈876), and a trust row (Free Shipping · Easy Returns · Secure Checkout, y≈977).
   - **Assessment:** *Mixed.* Price-on-first-screen through the sticky bar is fine and beats Yellow and Uniqlo (price below the fold). The order title → rating → price matches Gymshark and Daraz. But Allbirds and Nike put title + price above the gallery, and Sailor fits gallery + price + sizes + CTA in 844px. Ours shows the gallery, the title and the bar. The rating doesn't link to the reviews. Showing an exact count ("60 available") is honest, but it isn't urgency, and it leaks inventory. Manyavar and Daraz show "N left" only when low. The trust row is generic and identical everywhere (see homepage item 3).
   - **How it's built:** `src/features/products/components/ProductDetailClient.tsx:120-130` (badge), `:132` (h1), `:137-156` (rating, not a link), `:159-171` (price, hard-coded `৳`, no `<Price>`), `:197-218` (stock with `animate-pulse`). Trust row: `products/[slug]/page.tsx:99-110`.

4. **Mobile hides every variant chip behind "Select Options" → bottom sheet**
   - **Observed:** On mobile the page shows **no sizes at all**. The sticky bar says "🛒 Select Options". Tapping it opens an accessible bottom sheet (`role=dialog aria-modal=true`, labelled by its title) with SIZE chips (42×43px), a QTY stepper and a full-width "Add to Cart · ৳129.99".
   - **Assessment:** *Weak.* Every shoe and apparel reference shows the size grid **on the page** (Allbirds, Nike, Bata, Gymshark, Fabindia, Manyavar, Sailor). The size row is where fit notes, stock tags, "notify me" and the size guide live. Daraz is the one reference that uses a summary row ("Product Options: Size 38, White") that opens a sheet, and even it shows the current choice on the page. Hiding sizes costs us the "is my size there?" answer before the tap, and there is no place for a fit line. On the plus side, the sheet is a reusable `BottomSheet` primitive with proper dialog semantics, and the CTA label includes the price (Allbirds' pattern).
   - **How it's built:** The desktop inline selector is `hidden md:block` (`ProductDetailClient.tsx:222-240`). Mobile: `src/features/products/components/MobileBuyBar.tsx:78-121` (bar), `:118` (label), `:124-192` (sheet), `:136` ("Qty" hard-coded English).

5. **Add to Cart works with no size chosen** (defect)
   - **Observed:** On `air-runner-pro` I opened the sheet and tapped "Add to Cart · ৳129.99" **without picking a size**. A toast said "Add to Cart ✓", the sheet closed, the cart badge became 1, and `localStorage.cart` now held `"variantSelections":{"Size":""}`. The desktop button behaves the same (enabled with no size).
   - **Assessment:** *Broken CTA state.* Bata pre-selects a size, which is bad. We are worse: we accept *no* size. Both reference CTA patterns would prevent it: Allbirds' grey "Select a size" state, or Nike's always-active button that scrolls to the size grid with "Please select a size".
   - **How it's built:** `src/features/products/hooks/useProductSelection.ts:108-109` (`addToCart` checks only `displayStock`). `displayStock` falls back to the product's total stock when no variant matches (`useProductSelection.ts:78`). `MobileBuyBar.tsx:60-65` and `AddToCartSection.tsx:235-240` add without checking `hasOptions` against the selected values.

6. **Picking a size turns the price into ৳0** (defect)
   - **Observed:** After I tapped size 38 on the punjabi PDP, the sheet CTA read **"Add to Cart · ৳0"**. Loading `classic-white-oxford?Size=M` showed **"৳0 ~~৳69.99~~"** both inline and in the sticky bar. This happened on all three stores.
   - **Assessment:** *Broken.* This is the worst trust failure in the whole set: worse than Daraz's confusing voucher maths or Aarong's Tk 5,327.27.
   - **How it's built:** Variant `price` is nullable in the DB ("inherit product price", `src/db/schema/products.ts:78`). The mapper turns null into 0: `src/features/products/repository.ts:37` (`price: Number(row.price ?? 0)`). The selection hook then uses `activeVariant?.price ?? product.price` (`useProductSelection.ts:77`), and `??` doesn't fall back for 0. Admin saves can also write null (`repository.ts:264,328`), so this isn't only a seed problem. The cart line also stores `priceAtAdd: 0` (`useProductSelection.ts:115-116`). I did not open checkout to see whether the server re-prices.

7. **Size chips: struck-through when unavailable, cross-filtered by the other option**
   - **Observed:** No seeded variant was out of stock, so I couldn't see the state live. In code, an unavailable value is `disabled` + `line-through` + tertiary colour. Availability is cross-filtered against the other selected options (Allbirds' "colour struck through for sizes you can't get"). The selected chip gets a primary border plus an 8% tint. There is no `aria-pressed`, and the option `<label>` isn't tied to the chip group. There is no size guide, fit note, per-size "N left" or "notify me".
   - **Assessment:** *Good logic, thin content.* The strikethrough avoids Sailor's colour-only sold-out state, and cross-filtering matches Allbirds. Missing compared with the references:
     - a fit note: "runs true to size" (Allbirds), "customers say it fits true to size" (Gymshark), model height + size worn (Yellow, Uniqlo, Ecstasy, Fabindia)
     - an HTML size-guide table with a cm/inch toggle (Fabindia, Manyavar, Bata)
     - a per-size stock tag + notify-me (Manyavar)

     Option names come from data ("SIZE"), so they stay English in বাং.
   - **How it's built:** `src/features/products/components/VariantOptions.tsx:334-341` (label), `:343-371` (chips), `:357` (line-through). Logic: `useProductSelection.ts:93-106`. There is no size-chart or fit field in the `products` schema (`src/db/schema/products.ts`).

8. **WhatsApp / Messenger order handoff exists, but only inside the sheet (and isn't seeded)**
   - **Observed:** The seed has no `socialOrdering`, so no WhatsApp link appeared (`wa.me` count 0). In code, when it's enabled, WhatsApp and Messenger buttons render **inside the mobile bottom sheet** (and inline on desktop). They prefill product name, variant, quantity, price, total and URL from a per-store template. The call FAB is hidden on PDPs.
   - **Assessment:** *Strong feature, buried.* The prefilled message is exactly what the Sailor report wanted ("prefill product name, URL and size"), and it is better than Sailor's context-free `wa.me`, Yellow's share-only link, and Aarong and Zara (no chat). But it is two taps deep. A shopper who wants to ask before buying never sees it on the page.
   - **How it's built:** `src/features/products/components/SocialOrderButtons.tsx:30-50` (template + `wa.me` URL). Mounted at `MobileBuyBar.tsx:181-190` and `ProductDetailClient.tsx:230-239`.

9. **Add-to-cart feedback: a toast, nothing else**
   - **Observed:** Toast text "Add to Cart ✓" (the button label with a tick, not a sentence). There is no mini-cart, no "View cart / Checkout" action and no cross-sell. The cart badge in the bottom bar increments. On desktop the feedback is an inline green box with hard-coded "Added to cart!".
   - **Assessment:** *Weak.* None of the references shows the post-add moment well in their reports, but the toast should at least offer "View cart". Here, Gymshark's "Get the look" card or Allbirds' one-tap related add would fit.
   - **How it's built:** `MobileBuyBar.tsx:64`. `AddToCartSection.tsx:238,293-302` (hand-rolled alert instead of `<Alert>`/toast).

10. **Description, then tags, then reviews. No related products anywhere**
    - **Observed:** After the trust row there is a large gap (`mt-20 pt-14`), then the "Description" H2 (y≈1,130) with one sentence, then hashtag chips (#running #sneakers, which are **not links**), then another gap and "Customer Reviews ★★★★½ 4.6 out of 5", a "Log in to write a review" note, and **"No reviews yet. Be the first to review this product!"**. Then the footer. The page is about 2,700px. There is **no "You may also like", "Complete the look", "Similar" or recently viewed rail**.
    - **Assessment:** *Weak.*
      - **The header says 4.6 / 28 reviews, and the list says none.** This is the Sailor mistake ("True to size 100%" from 0 reviews), even if the seed caused it: the UI trusts the denormalized counters without any guard.
      - No recommendation rail means the PDP is a dead end. Every reference except Ecstasy has at least one rail, often two (Aarong's up-sell + down-sell, Manyavar's complete-the-look tabs, Uniqlo's comparison rail).
      - The description is one free-text block. Aarong, Fabindia and Bata use a structured spec table (fabric, fit, collar, care), and Fabindia's opens by default.
      - There are no accordions or tabs, so the page would get long with real content.
      - No delivery, COD or returns line sits near the CTA, even though the store has `deliveryConfig` (inside/outside Dhaka fees) and `refundPolicy.windowDays`. Those are used only at checkout.
    - **How it's built:** `products/[slug]/page.tsx:113-143` (description + tags), `:146-153` (`ReviewSection`). `src/features/reviews/components/ReviewSection.tsx:44,49,63` and `ReviewList.tsx:68` are hard-coded English. Delivery config: `src/shared/lib/delivery.ts:8-18`, used only in `src/app/(storefront)/checkout/page.tsx`. Refund policy type: `src/features/stores/types.ts:130-135`.

11. **Sticky buy bar: always on, above the bottom nav**
    - **Observed:** It is fixed at `bottom: 3.5rem + safe-area`, 63px tall (price + compare-at on the left, a 52px brand CTA on the right), visible from first paint, and stacked on the 57px tab bar. That is about 120px of fixed chrome at the bottom, plus the 64px header, so 184px of 844 is fixed.
    - **Assessment:** *Good, with a cost.* A sticky ATC is the most-requested takeaway (Aarong, Yellow, Allbirds, Bata, Manyavar, Fabindia, Nike, Daraz), and ours includes the price. It shows from first paint like Fabindia's. Manyavar and Allbirds show it only once the inline CTA leaves the screen, but on mobile we *have* no inline CTA, so always-on is consistent. Two stacked bottom bars take 14% of the screen. Daraz merges them into one bar (Store/Chat + Buy Now + Add to Cart), and Gymshark limits stickiness to the buy box. There is no "Buy now" express path (Yellow, Bata, Sailor, Daraz).
    - **How it's built:** `MobileBuyBar.tsx:78-84`.

12. **SEO plumbing**
    - **Observed:** Each page has its own `<title>` ("Air Runner Pro | Shoes World"), a canonical URL (`https://shoes.localhost/products/air-runner-pro`), `og:image`, and Product + BreadcrumbList JSON-LD. But:
      - the Product JSON-LD has **`priceCurrency: "USD"`** while the UI prices are ৳
      - its `image` URLs are **relative** (`/api/media/…`)
      - the `og:image` host is `localhost:3100`, not the store domain
      - the breadcrumb has no category level
      - the homepage has no `h1`
    - **Assessment:** *Better than most references* (Aarong has no JSON-LD and the slug as title; Ecstasy has one title site-wide; Fabindia and Bata output duplicate Product JSON-LD). These are small but real data errors.
    - **How it's built:** `src/shared/lib/seo.ts:62` (relative images), `:67` (`"USD"`), `:74` (aggregateRating). `products/[slug]/page.tsx:54` builds `storeUrl` from `tenant.domains[0]`.

**Page weight / performance (PDP, `next dev`):** 38–44 requests, about 6.0MB decoded (dev JS). Images: the main original is 6–10KB and the thumbnails are 1–3KB (placeholders). LCP is the main image at 1.6–1.9s. There are no third parties. Fixed elements: header (64px), sticky bar (63px), tab bar (57px).

**Accessibility notes (REA `ev_dbef22ab…`):**
- Thumbnails get accessible names from their `alt` ("Air Runner Pro – view 1"). That is good, and better than Uniqlo's and Sailor's unlabelled controls.
- The EN/বাং buttons have no pressed state.
- The main image is a clickable `div`. Keyboard users have to rely on the hover-only expand button.
- Quantity buttons on desktop have no `aria-label` (`AddToCartSection.tsx:257-275`). Mobile has them (`MobileBuyBar.tsx:147,159`).

---

## Bengali (bn) check

Tested on Punjabi Palace: tap "বাং", then reload the homepage and `/products/embroidered-silk-punjabi`.

**What changes (works):**
- `<html lang="bn">`, and the `NEXT_LOCALE=bn` cookie is set.
- The body font switches to **Hind Siliguri**.
- Nav, section titles, trust tiles, buttons ("অপশন নির্বাচন করুন", "কার্টে যোগ করুন"), the discount pill ("সেভ 22%"), the review count ("7 পর্যালোচনা") and breadcrumbs are translated.
- The trust copy fits better in bn ("বিনামূল্যে শিপিং / ৳৫০০-এর উপরের অর্ডারে" shows in full).

**What breaks or stays English:**
- **Product and category names and descriptions** stay English ("Embroidered Silk Punjabi", "Cotton Punjabi"). The seed only fills `en`, and `t()` falls back silently. That is content, not code, but the admin doesn't flag missing `bn`.
- Hard-coded UI strings:
  - "Hover to zoom · Click to expand" (`ProductImageGallery.tsx:191`)
  - "★ Featured" and "New" (`ProductCard.tsx:76,90`)
  - "Only N left" (`ProductCard.tsx:163`)
  - "Search" tab (`MobileBottomNav.tsx:114`)
  - "Qty" (`MobileBuyBar.tsx:136`)
  - "Customer Reviews", "out of 5", "Log in to write a review…", "No reviews yet…" (`ReviewSection.tsx:44,49,63`, `ReviewList.tsx:68`)
  - desktop "Added to cart!" (`AddToCartSection.tsx:238`)
  - the toast "✓" suffix
- **Option names and values** ("SIZE", "S/M/L") come from data and aren't localized.
- **Prices use Latin digits** ("৳3,500") in bn. `Price.tsx:18` already formats `bn-BD` digits, but storefront cards and the PDP don't use `<Price>` (it is used only in `account/page.tsx` and `orders/page.tsx`). Whether to show Bengali numerals is a product decision. The real problem is that the primitive is bypassed.
- The header's "EN / বাং" pill takes about 145px of a 390px header on every page. Yellow and Daraz show Bengali content without a permanent toggle in the header.

---

## Desktop quick pass (1280×800, Shoes World)

- **Homepage:**
  - The header shows Home/Products nav, the EN/বাং pill, theme toggle, search, cart with badge, Track Order and Login.
  - The trust strip becomes a single row of 4 (no truncation).
  - "Shop by Category" puts 3 small 96px circles in a 1,216px-wide row, which leaves most of the band empty.
  - The first product card starts at **y≈837 (1.05 screens)**, so the first desktop screen has **no product**.
  - The call FAB shows the phone number as text ("+1-555-0200", seed).
- **PDP:**
  - A two-column layout: a 572px square gallery on the left; badge, H1, rating, price, short description, stock, **inline SIZE chips** and quantity + "Add to Cart" on the right, all above the fold. This is a solid layout.
  - Same defects as mobile: Add to Cart is enabled with no size, and the "Hover to zoom" pill (here it is accurate).
  - There is no sticky CTA on desktop, which is acceptable because the CTA stays in view.
  - Thumbnails sit below the fold under the 572px image.

---

## "They have it, we don't"

Status key: **Have** = we already do it well. **Partial** = some of it exists. **Missing** = not built.

### Homepage

| Idea | Seen at (sites) | What we have today | Gap (file:line) |
|---|---|---|---|
| Products and prices on the first screen (rail right under the hero) | Ecstasy, Sailor, Bata, Daraz, Nike (anti: Aarong, Uniqlo, Manyavar, Yellow, Zara, Gymshark) | **Partial.** First card at about 0.98 screens, under the tab bar. It would be about 1.6 screens with a hero. | Trust grid + category header too tall: `src/app/(storefront)/page.tsx:69-118`, `:122-123`. Hero 512px: `HeroBanner.tsx:241` |
| "Campaign then product rail" pairing (each banner followed by its products) | Nike | **Missing.** The hero and the grids are unrelated. | `page.tsx:61-66` vs `:202-278`; banners have no product/collection link model beyond `linkUrl` |
| Short, wide promo hero for sale periods | Sailor, Bata | **Missing.** All hero layouts are 22–32rem tall on mobile. | `HeroBanner.tsx:241,439,601,762,917` |
| Hero names the audience + one clear CTA per slide | Ecstasy, Aarong, Allbirds (gender CTAs), Nike (anti: Yellow, no CTA) | **Partial.** Banners have title/subtitle/CTA fields. The seed has none. | Content; `HeroBanner.tsx` RotatingLayout |
| Pause control on rotating content | Gymshark | **Missing.** 7s auto-advance, no pause. | `HeroBanner.tsx:11,120` |
| LCP hero eager + priority, no hidden duplicate images | Sailor, Fabindia PDP, Manyavar PDP (anti: Aarong, Gymshark, Allbirds, Bata) | **Have.** Slide 1 `priority`, one `<img>`, `sizes=100vw`. | n/a |
| Compact, static trust strip (exchange, delivery fee, delivery time, COD) under the hero | Yellow, Allbirds, Manyavar, Gymshark (rotating) | **Partial.** A 2×2 grid, about 290px, truncated, same generic copy for every tenant, no COD or Dhaka fee. | `page.tsx:69-118`; copy in `messages/*.json` `home.*`; not wired to `deliveryConfig` (`src/shared/lib/delivery.ts:8`) or `refundPolicy` (`stores/types.ts:130`) |
| Large 2-column photo category tiles (person wearing the category) | Aarong, Yellow, Bata, Sailor, Ecstasy, Uniqlo (icon grid) | **Partial.** 80px circles with `object-contain`, in a horizontal scroll. | `page.tsx:163-186` (`w-20 h-20`, `sizes="96px"`) |
| Budget tiles ("Panjabi under ৳1,500") linking to a pre-filtered grid | Fabindia, Bata (price bands in menu) | **Missing.** | No price-band entry point on the homepage or in `/products` links |
| Occasion / persona picker (Eid, wedding, groom, Puja) | Manyavar, Gymshark (by activity), Fabindia (colour of the month) | **Missing.** No `occasion` attribute; tags exist but aren't merchandised. | `products.tags` unused on the homepage; `page.tsx` |
| Tabbed or chip-filtered product rail (Men/Women/Kids; Casual/Formal/Sandal) | Bata, Sailor, Manyavar, Gymshark, Uniqlo (gender tabs) | **Missing.** Two separate, non-deduped grids. | `page.tsx:202-278`; `ProductService.getFeatured/getNewArrivals` `service.ts:62-68` |
| Swipe rail with peeking next card | Ecstasy, Allbirds, Nike, Fabindia | **Missing** for products (category chips do scroll). | `ProductGrid.tsx:25` grid only |
| Numbered "Top 10" / best-seller rail | Gymshark | **Missing.** | n/a |
| Flash sale with countdown (real, time-boxed campaigns only) | Daraz | **Missing.** | No campaign/end-date model |
| Customer photo testimonials (real customer wearing the product) | Manyavar | **Missing.** | n/a |
| Persistent chat entry (WhatsApp/Messenger) | Sailor, Fabindia, Ecstasy (footer), Bata (menu) | **Partial.** The FAB is `tel:` only and hidden on the PDP. WhatsApp exists only in the PDP sheet. | `FloatingCallButton.tsx:24-26,42` |
| App-style bottom tab bar with labels and a cart count | Sailor, Daraz | **Have.** Labelled, with cart badge and Track Order. | Only the "Search" label is hard-coded: `MobileBottomNav.tsx:114` |
| Search prominent (field, not icon) with suggestions | Daraz, Uniqlo, Nike | **Partial.** Search icon in the tab bar opens a field. No suggestions. | `MobileBottomNav.tsx:155-190` |
| Hide-on-scroll header | Nike, Gymshark, Manyavar (PDP) | **Missing.** The header is always sticky (64px). | `Header.tsx:112` |
| Visual menu with photo tiles; shop by size / price band | Zara, Bata | **Missing.** There is no hamburger menu on mobile at all (nav is the tab bar + "Products"). | `Header.tsx:170` (desktop nav only) |
| Geo / right-store detection across domains | Zara | **n/a.** Tenant is resolved by domain. Not needed. | — |
| No blocking pop-ups or interstitials on first visit | (anti: Aarong, Ecstasy, Sailor, Nike, Manyavar, Gymshark, Zara) | **Have.** No modal, cookie sheet or app banner. `AnnouncementBanner` is a dismissible strip. | n/a |
| Lean third-party footprint | (anti: every reference, 15–30 tags) | **Have.** Zero third-party hosts. | Keep it that way |

### Product card

| Idea | Seen at (sites) | What we have today | Gap (file:line) |
|---|---|---|---|
| Name + price always visible | Allbirds, Bata, Yellow, Uniqlo, Daraz (anti: Aarong, Nike, Zara zoom 3) | **Have.** | n/a |
| Struck-through compare-at + discount % that matches the PDP | Ecstasy (inconsistent), Bata, Sailor, Daraz | **Have.** "-22%" on the card and "Save 22%" on the PDP, both computed the same way. | Card uses hard-coded `৳`, not `<Price>`: `ProductCard.tsx:153-158` |
| Rating + count on the card (only above a threshold) | Uniqlo, Daraz, Gymshark | **Partial.** Shown whenever `averageRating > 0`, with no minimum count. | `ProductCard.tsx:125-144` |
| In-stock size range / size list on the card | Bata, Uniqlo | **Missing.** | `ProductCard.tsx` (no variants used) |
| Colour / image swatches on the card (sold-out struck through) | Yellow, Allbirds, Uniqlo, Zara | **Missing.** | `ProductCard.tsx` |
| Quick add / "+" on cards (opens size sheet, explicit confirm) | Yellow, Zara, Gymshark, Allbirds (related) | **Missing.** The whole card is one link. | `ProductCard.tsx:32-36` |
| Wishlist heart | Aarong, Sailor, Uniqlo, Gymshark, Manyavar, Bata | **Missing.** No wishlist feature. | n/a |
| Portrait 4:5 / 3:4 image for apparel; square for shoes | Yellow, Fabindia, Sailor, Gymshark, Uniqlo / Allbirds, Bata | **Partial.** Always `aspect-square`, the same for every tenant. | `ProductCard.tsx:38`; no per-store ratio in theme |
| Merch / festival tag pill ("Eid Special", "Bestseller") driven by a tag | Manyavar, Uniqlo, Fabindia, Daraz | **Partial.** Only automatic Sale/New/"Featured". "Featured" is internal and in English. | `ProductCard.tsx:71-92` |
| Low-stock text | Daraz, Manyavar | **Have** ("Only N left" at ≤5), but in English. | `ProductCard.tsx:161-165` |
| "N sold" social proof (real numbers only) | Daraz | **Missing.** | n/a |
| Card a11y: one link with a summary `aria-label`, no nested buttons | Uniqlo (summary label; nested-button anti) | **Partial.** One clean link. Its accessible name is the whole card text. | `ProductCard.tsx:32` |

### PDP

| Idea | Seen at (sites) | What we have today | Gap (file:line) |
|---|---|---|---|
| Title + price above or right under the gallery, first screen | Allbirds, Nike, Gymshark, Daraz, Sailor (anti: Yellow, Uniqlo) | **Partial.** The price is visible only in the sticky bar. The inline price at y≈745 is hidden under it. | `ProductDetailClient.tsx:132-171` order; bar `MobileBuyBar.tsx:78-84` |
| Swipe gallery (native scroll-snap) with dots or "1 / N" counter | Allbirds, Nike, Gymshark, Uniqlo, Yellow, Fabindia, Daraz, Manyavar | **Missing on mobile.** Tap thumbnails only. The counter exists only in the lightbox. | `ProductImageGallery.tsx:142-193` (no touch handling), `:196-223` |
| Pinch / tap zoom on touch | Yellow, Bata (lightbox), Zara, Gymshark | **Partial.** The lightbox has wheel/keyboard/drag zoom; no pinch. The hint says "Hover". | `ProductImageGallery.tsx:68-78,189-192` |
| Responsive main image (variant `srcset`), first image eager | Gymshark (srcset); anti: Yellow, Allbirds, Manyavar, Zara oversized | **Partial.** Eager + high priority, but `fullRes` sends the original with no `srcset`. | `ProductImageGallery.tsx:163-164`; `StoreImage.tsx:115-116` |
| Fixed shot list (side, back, top, sole, pair / front, back, embroidery close-up) | Allbirds, Aarong (gap), Zara | **Missing** (content guideline). The admin has no shot-list hint. | Admin `ProductForm` |
| Size chart as a gallery slide | Ecstasy | **Missing.** | n/a |
| Model height + size worn (on the image or in specs) | Uniqlo, Yellow, Ecstasy (body measurements), Fabindia | **Missing.** No field. | `src/db/schema/products.ts` |
| "Highly rated" badge on the first image (threshold-based) | Nike | **Missing.** | `ProductImageGallery.tsx` |
| Live view counter (honest numbers only) | Gymshark, Manyavar ("12 people viewed") | **Missing.** We have `product_view` analytics events that could feed it. | `ProductDetailClient.tsx:32-40` tracks views |
| Size chips visible on the page (not hidden in a sheet) | Allbirds, Nike, Bata, Gymshark, Fabindia, Manyavar, Sailor | **Missing on mobile.** Desktop only. | `ProductDetailClient.tsx:222` (`hidden md:block`) |
| Sold-out size struck through (not colour only) | Allbirds, Nike, Fabindia (anti: Sailor) | **Have.** `disabled` + `line-through`. | `VariantOptions.tsx:357` (no `aria-pressed`) |
| Cross-filter options (colour by size) | Allbirds | **Have.** `isValueAvailable` filters against the other selections. | n/a |
| Per-size "N left" + "notify me" on sold-out sizes | Manyavar | **Missing.** | `VariantOptions.tsx:343-371` |
| Never pre-select a size, and **never add without one** | Allbirds ("Select a size"), Nike (scroll to grid + error) (anti: Bata, Uniqlo pre-select) | **Broken.** No pre-select (good, `useProductSelection.ts:43-58`), but Add to Cart accepts an empty size. | `useProductSelection.ts:108-109`; `MobileBuyBar.tsx:60-65`; `AddToCartSection.tsx:235-240` |
| CTA label carries the price ("Add to cart · ৳X") | Allbirds | **Have** in the sheet. **But** it shows ৳0 after a size is picked. | `MobileBuyBar.tsx:178`; price bug `repository.ts:37` + `useProductSelection.ts:77` |
| Fit verdict line ("Customers say it fits true to size") / fit note | Gymshark, Allbirds, Ecstasy, Uniqlo | **Missing.** Reviews have no fit field. | `src/features/reviews/*`; `VariantOptions.tsx` |
| Fit-type line under the title ("Slim fit", "Long panjabi 44 in") | Gymshark | **Missing.** No field. | `ProductDetailClient.tsx:132` |
| HTML size guide with cm/inch toggle + how to measure (+ Bata size, EU/UK/US for shoes) | Fabindia, Manyavar, Bata (image anti), Yellow (image anti), Uniqlo | **Missing.** | No size-chart model; the `Modal`/`BottomSheet` primitives exist |
| Image / fabric-crop / product-photo colour swatches | Fabindia, Yellow, Nike, Gymshark, Uniqlo | **Missing.** Text chips only. | `VariantOptions.tsx:343-371` |
| Saving amount line ("You save ৳640") | Daraz | **Partial.** "Save 19%" pill only. | `ProductDetailClient.tsx:120-130` |
| COD / "check before you pay" line next to the price | Bata, Fabindia (honest policy lines) | **Missing.** | `products/[slug]/page.tsx:99-110` generic trust row |
| Delivery fee + estimate (inside / outside Dhaka, district pre-filled) near the CTA | Daraz, Manyavar (with on-time stat), Uniqlo (dated), Yellow, Allbirds (free shipping pill) (anti: Nike defers to checkout) | **Missing on PDP.** `deliveryConfig` exists but is used only at checkout. | `src/shared/lib/delivery.ts:8-18`; `checkout/page.tsx`; PDP `page.tsx:99-110` |
| Returns / exchange window shown honestly per store | Fabindia, Daraz (Service row), Yellow | **Partial.** A generic "Easy Returns" label, not `refundPolicy.windowDays`. | `products/[slug]/page.tsx:102`; `stores/types.ts:130-135` |
| Pay-later / EMI / "pay on delivery" framing above the CTA | Nike, Gymshark | **Missing.** | n/a |
| Sticky add-to-cart with price | Yellow, Allbirds, Bata, Manyavar, Fabindia, Nike, Daraz, Zara | **Have** (always on, mobile only). | Stacks on the tab bar: `MobileBuyBar.tsx:81` |
| Variant switcher inside the sticky bar | Bata, Daraz (sheet) | **Have.** The bar opens the variant sheet. | n/a |
| Collapsing sticky panel / sticky only within the buy box | Zara, Gymshark | **Missing.** Alternative to prototype. | `MobileBuyBar.tsx` |
| "Buy now" express path next to Add to cart | Yellow, Bata, Sailor, Daraz | **Missing.** | `MobileBuyBar.tsx:107-119` |
| Subtotal line (qty × price) before commit | Bata | **Partial.** Shown only for bulk tiers. | `ProductDetailClient.tsx:179-193` |
| WhatsApp / Messenger order with product, size and price prefilled | Sailor (no prefill), Fabindia (`text=hi`), Daraz (Chat), Yellow (share only) | **Have, but buried.** Full prefill, inside the sheet only. | `SocialOrderButtons.tsx:30-50`; mounted `MobileBuyBar.tsx:181-190` |
| Find in store / store stock | Aarong, Sailor, Uniqlo, Zara, Nike | **Missing** (needs per-location stock; only for tenants with shops). | n/a |
| Structured spec table (fabric, fit, collar, sleeve, care, dispatch time), open by default | Aarong, Fabindia, Bata, Ecstasy | **Missing.** One free-text description. | `products/[slug]/page.tsx:113-128`; no spec fields in schema |
| Accordions / tabs for description, materials, delivery, returns | Allbirds, Aarong, Uniqlo, Manyavar, Zara (tabs), Gymshark (tabs) | **Missing.** Flat sections with big gaps (`mt-20 pt-14`). | `products/[slug]/page.tsx:113,146` |
| Benefit-first copy + "best for" chips | Allbirds, Gymshark ("Designed for") | **Missing.** Tags show as non-link `#chips`. | `products/[slug]/page.tsx:130-142` |
| Sticky section tabs (Details · Reviews · You may like) | Daraz | **Missing.** | n/a |
| Star rating near the title that links to reviews | Gymshark, Daraz, Uniqlo (anti: Allbirds hides it) | **Partial.** Shown, but not a link. | `ProductDetailClient.tsx:137-156` |
| Reviews: % recommend, histogram, fit / comfort bars, filter by height/size, buyer photos, show negatives | Gymshark, Uniqlo, Sailor, Daraz, Nike | **Missing.** Average + list only. The header and the list can disagree (4.6/28 vs "No reviews yet"). | `src/features/reviews/components/ReviewSection.tsx:16-70` |
| Q&A in Bengali with "answered within X hours" | Daraz | **Missing.** | n/a |
| UGC / customer outfit photos with height + size | Uniqlo, Nike, Manyavar | **Missing.** | n/a |
| Related rails: "Similar" (same price) + "You may also like" (cheaper) | Aarong, Yellow, Fabindia, Bata, Manyavar, Nike, Zara, Daraz | **Missing.** No recommendation rail of any kind. | `products/[slug]/page.tsx` (nothing after reviews); no `findRelated` in `ProductRepository` |
| Complete the look / bundle with one "Add bundle" (same store only) | Manyavar, Nike, Gymshark, Zara, Uniqlo (paired items) | **Missing.** | n/a |
| One-tap add on related cards | Allbirds, Manyavar, Zara, Gymshark | **Missing** (no related cards). | n/a |
| "Similar fabric / colour" text chips to filtered grids | Manyavar | **Missing.** | n/a |
| Spec comparison rows under related products | Uniqlo | **Missing.** | n/a |
| Recently viewed rail | Yellow, Sailor | **Missing.** | n/a |
| Breadcrumb with the category level | Aarong, Bata, Ecstasy | **Partial.** Home › Products › name. | `products/[slug]/page.tsx:77-89`, `:58-62` (JSON-LD too) |
| Product JSON-LD with the right currency, absolute images, rating; once per page | Yellow, Sailor, Nike (anti: Aarong none, Fabindia/Bata duplicate) | **Partial.** Rendered once, but `USD` and relative image URLs. | `src/shared/lib/seo.ts:62,67` |
| Add-to-cart feedback with a next step (view cart / cross-sell) | (gap in every report) | **Partial.** Toast "Add to Cart ✓" only. | `MobileBuyBar.tsx:64` |

### i18n / locale

| Idea | Seen at (sites) | What we have today | Gap (file:line) |
|---|---|---|---|
| Bengali UI | (none of the 13 has one; Yellow uses bilingual hero art; Daraz has Bengali Q&A content) | **Have.** Full `next-intl` bn with Hind Siliguri. This is our clearest lead over every reference. | Hard-coded strings listed in the Bengali check |
| Round BDT prices, one consistent format | (anti: Aarong Tk 5,327.27, Sailor decimals and old price without ৳, Yellow "+ VAT") | **Partial.** Format is consistent (`৳1,200`), but decimals show when the data has them (`৳129.99`). The `<Price>` primitive is bypassed. | `ProductCard.tsx:153`; `ProductDetailClient.tsx:164,168`; `MobileBuyBar.tsx:92,96,178` |

---

## "Their mistakes we also make"

- **Fake-looking or unverified social proof** (Yellow's "someone purchased" app, Sailor's "True to size 100%" with 0 reviews, Manyavar's "12 people viewed"):
  - our newsletter's coloured-circle "avatars" + "Join 2,000+ subscribers" (`page.tsx:345-362`)
  - PDP "4.6 out of 5 · 28 reviews" next to "No reviews yet" (`ReviewSection.tsx:44-70`)
  - stars on cards with no minimum count (`ProductCard.tsx:125`)
- **Trust claims that don't match the store's real policy** (Fabindia's "COD, Easy returns" meta vs "Non-Returnable"). Our trust grid and PDP trust row are global strings ("30-day return", "Free shipping over ৳500", "24/7 Support") and ignore `refundPolicy` and `deliveryConfig` (`page.tsx:72-92`, `products/[slug]/page.tsx:100-104`).
- **Price trust failures** (Daraz's mismatched maths, Aarong's paisa, Sailor's decimals): ৳0 after choosing a size (`repository.ts:37`), and `৳129.99`-style decimals (no rounding).
- **Size handling that lets a wrong order through** (Bata pre-selects, Zara adds on one tap): we add **with no size** (`useProductSelection.ts:109`).
- **Sizes hidden instead of shown** (Aarong and Ecstasy use a `<select>`): our mobile PDP hides all chips behind "Select Options" (`ProductDetailClient.tsx:222`).
- **Delivery and COD info missing near the CTA** (Aarong, Ecstasy, Sailor, Bata, Nike defers to checkout, Daraz omits COD). The data exists, but the PDP doesn't show it.
- **No reviews content / review UI that never renders** (Yellow, Bata, Fabindia, Zara, Allbirds' empty widget): ours renders, but with seed counters and no reviews it reads as broken.
- **PDP dead end with no rail** (Ecstasy has only 2 related items; Fabindia only colour clones): we have none.
- **Hover-only affordances on touch** (Ecstasy and Bata hover swaps that can't be used on a phone): "Hover to zoom" pill, hover-only expand button, hover-only "View Details" (`ProductImageGallery.tsx:182,189-192`; `ProductCard.tsx:104-115`).
- **Oversized image to a phone** (Yellow, Allbirds, Manyavar, Zara): the PDP main image ships the original via `fullRes` with no `srcset` (`ProductImageGallery.tsx:164`). Harmless with placeholders, costly with real 4000px uploads.
- **Long editorial blocks pushing shoppable content down** (Yellow's story copy, Bata's blog): our 330px category header for 3 chips, and the 1,000px newsletter panel.
- **Untranslated strings leaking into a localized UI** (Gymshark's `reviews.search_label` key): about a dozen English strings show in বাং (see the Bengali check).
- **Internal labels shown to shoppers** (Bata's "Promocode" variant, Yellow's SKU before price): "★ FEATURED" on every featured card (`ProductCard.tsx:90`).
- **Perpetual attention animation**: the pulsing call FAB and the pulsing "In stock" dot (`FloatingCallButton.tsx:47`, `ProductDetailClient.tsx:201`). It is milder than Ecstasy's pop-up, but against our own animation rule.
- **Tracking stacks, blocking modals, app banners, divs instead of links**: we avoid all four. We have zero third parties, no interstitials, and real `<a>` cards.

---

## Measure later (with `analytics`)

Our `useTrackEvent` already sends `product_view` and `add_to_cart` (`ProductDetailClient.tsx:32-40`, `useProductSelection.ts:128-134`). The items below need new events or properties.

- **Homepage**
  - Scroll depth to the first product card (px and screens), per store, with vs. without a hero.
  - Product-card impression → click rate by position and section (New Arrivals vs Featured vs a future tabbed rail).
  - Hero slide impressions by index and CTA clicks per slide (do slides 2+ get seen at 7s?).
  - Category-tile clicks: small circles vs large photo tiles; budget-tile and occasion-tile clicks vs plain categories.
  - Trust-strip visibility vs checkout-start rate, once it carries real COD/delivery/returns copy.
  - Call-FAB taps vs WhatsApp taps (once a chat FAB exists).
- **Card**
  - CTR with vs. without a size row, swatches, rating threshold and quick add; quick-add adds vs PDP adds; wrong-size returns from quick add.
- **PDP**
  - Gallery engagement: swipes, thumbnails tapped, lightbox opens, images viewed per session.
  - Variant sheet opened → size picked → added (funnel), and add attempts with no size (should become 0, or a guided error count).
  - Inline size chips vs sheet-only: size-selected rate and add-to-cart rate.
  - Sticky bar taps vs inline CTA taps (desktop/mobile); always-on vs appear-on-scroll vs buy-box-only variants.
  - Fit-note / size-guide opens vs size-related exchanges and returns.
  - Delivery + COD line shown → add-to-cart and checkout-start rate, split inside vs outside Dhaka.
  - WhatsApp/Messenger taps per PDP view (in-sheet vs on-page placement), and orders that follow.
  - Related / complete-the-look rail: impressions, clicks, attach rate, and order value with vs. without a bundle.
  - Reviews reach (scroll or tab tap) and conversion for sessions that read reviews; effect of a "highly rated" badge.
  - Add-to-cart feedback: "View cart" taps from the toast and cart-open rate.
- **Locale**
  - Share of sessions in bn vs en, conversion per locale, and toggles mid-session (especially on PDPs with missing `bn` content).
- **Performance**
  - Mobile LCP per page type in production, and image bytes per PDP once real photos exist (watch the `fullRes` original).

---

## Not observed / couldn't check

- **Hero banner rendering, category photos and real WhatsApp buttons**: the seed has none, so these were assessed from source only.
- **Out-of-stock variant states**: no seeded variant has zero stock. The strikethrough is from code (`VariantOptions.tsx:357`).
- **Real review content**: the seed has counters only.
- **Production weight and timing**: the dev server only. The ≈6MB per page is mostly unminified dev JS and HMR.
- **Checkout re-pricing** of the ৳0 variant line: checkout is out of scope.
- **Cart page and drawer** beyond the badge and toast; **logged-in account tab**.
- **Real swipe gestures**: driven by script.
- **Announcement banner**: the component exists, but no announcement was seeded.

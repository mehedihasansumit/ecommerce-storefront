---
status: accepted
date: 2026-10-23
---

# Per-store data cache for slow-changing storefront reads; media served from Cloudflare R2

Every storefront page view used to hit Postgres 9–20 times, including the store
lookup and category lists that change a few times a month, and every image and
video went through the Next.js server. We decided to cache only the reads that
rarely change, tagged per Store and expired by every write for that Store, and to
serve media from a Cloudflare R2 bucket on our own domain.

## What is cached and how it is expired

- Cached across requests (`unstable_cache`, `src/shared/lib/data-cache.ts`): the
  Store by domain, the Store's categories and top-level categories with products,
  and the home page's featured and new-arrival rows. Home page: ~20 queries per
  view down to ~2 when warm.
- Every service write that changes what the storefront shows calls
  `invalidateStore(storeId)`: store, category and product writes, review
  moderation (ratings), and order stock changes (`src/features/orders/stock.ts`).
  Store writes also expire the domain lookups. A write path that forgets the call
  is still corrected after 300 seconds.
- **Deliberately not cached:** product detail, the `/products` listing and
  category product lists. Price and stock there must be live; a shopper must
  never see a size as available after it sold out. They are only deduplicated
  within one request (`getProductBySlug`, `getCategoryBySlug`).

## Considered options

- **Cache whole pages (ISR / `"use cache"` with Cache Components):** pages are
  per-Host and per-locale, read the cart and session, and Cache Components would
  change rendering across the whole app. Rejected for now.
- **Short TTL only, no invalidation:** simpler, but an admin's edit would take
  minutes to appear. Rejected: admins expect to see their change on reload.
- **Keep media behind `/api/media` with a CDN in front of the app:** works, but
  every cache miss still costs a Node stream from storage. R2 with a custom
  domain is cached by Cloudflare's edge, has no egress fees, and answers range
  requests (video seeking, Safari playback) itself.

## Consequences

- **Single instance only.** The built-in data cache lives on each Next.js
  process's disk. With more than one app instance, an admin save only expires
  the instance that handled it; the others serve stale data for up to 300
  seconds. Scaling out requires a shared cache handler (e.g. Redis) first.
- Media is tied to Cloudflare. Leaving means copying the bucket and rewriting
  stored links again (`scripts/copy-media-to-r2.ts` and
  `scripts/rewrite-media-urls.ts` work for any S3-compatible target).
- Stored media links become absolute (`https://media.<domain>/<key>`) after the
  migration. Old `/api/media/...` links keep working: the proxy reads the same
  keys from R2, and now supports ranges and ETags too.
- Images are never run through the Next.js image optimizer; uploads already get
  400/800px WebP variants.
- The service worker no longer stores cart, checkout, account or order pages,
  and keeps at most 60 pages and images.

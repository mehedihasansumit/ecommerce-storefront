# Caching and Cloudflare R2 Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut per-page database work with a per-store data cache, serve media correctly (byte ranges, conditional requests) and from Cloudflare R2's CDN in production, and stop the service worker from storing personal pages.

**Architecture:** Storefront reads that change rarely (store by domain, categories, featured and new-arrival products) go through `unstable_cache` wrappers tagged `store:<storeId>`; every service write for that store calls one `invalidateStore(storeId)`. Media keeps the `/api/media` proxy for dev (now range- and ETag-aware) and in production is served straight from an R2 bucket on a custom domain (`S3_PUBLIC_URL`); stored `/api/media/...` URLs are rewritten once by a migration script.

**Tech Stack:** Next.js 16.2 App Router, React 19, Drizzle/Postgres, `@aws-sdk/client-s3` 3.1063 against RustFS (dev) and Cloudflare R2 (prod), Vitest (new, unit tests only).

**Spec:** No separate design doc; the user skipped the design questions ("shuru koro"). Requirements are the five items from the caching audit in this session plus "use Cloudflare R2", restated in Global Constraints.

## Global Constraints

- Architecture rules in `CLAUDE.md`: route → service → repository; only repositories touch `db`; every query scoped by `storeId`; admin stays brand-neutral.
- Cache tag format: `store:<storeId>`; domain lookups additionally tagged `store-domains`.
- Invalidation: `revalidateTag(tag, { expire: 0 })` (Next 16 signature; immediate expiry, not stale-while-revalidate).
- Time-based backstop for every cached read: `revalidate: 300` seconds.
- Product detail and `/products` listing data are NOT cross-request cached (stock and price must be live); only deduped per request.
- Uploaded objects keep `Cache-Control: public, max-age=31536000, immutable` (keys are random; a replaced image gets a new key).
- R2 client settings: `region: "auto"`, `forcePathStyle: true`, `requestChecksumCalculation: "WHEN_REQUIRED"`, `responseChecksumValidation: "WHEN_REQUIRED"`.
- `next.config.ts` images stay `unoptimized: true` in all environments (R2 serves the pre-built `-w400/-w800` variants; no Next image optimizer on the server).
- Any write to the `ecommerce` DB needs a `pg_dump` backup and a `--dry-run` first.
- No `git push`.

## Review Focus

1. A write path that changes storefront data but skips `invalidateStore` (stock change on order create/cancel, review approval changing ratings, image upload) → shoppers see stale data for up to 300s. Task 3 lists every writer and Task 3's test asserts each service method calls `invalidateStore`.
2. `unstable_cache` JSON round-trip turns `Date` fields into strings → code calling `.getTime()` on `createdAt` breaks. Task 2 revives `*At` keys; its test pins this.
3. A `Range` header that is malformed, multi-range, or past the end → must not crash; return the full object (200) for malformed/multi-range and 416 for unsatisfiable. Task 1 tests pin this.
4. Personal pages already sitting in a visitor's service-worker cache from the old version → must be purged on update. Task 5 bumps `CACHE_VERSION` and verifies the old cache is deleted.
5. A stored URL that is already absolute (external `https://images.unsplash.com/...`) or uses a different host → migration must leave it untouched and be idempotent on re-run. Task 6 tests pin this.

---

### Task 0: Add Vitest

**Files:**
- Modify: `package.json` (devDependency `vitest`, script `"test": "vitest run"`)
- Create: `vitest.config.ts` (node environment, `@` alias → `src`)

- [ ] **Step 1:** `npm i -D vitest` and add the script and config.
- [ ] **Step 2:** Run `npm test` → Expected: "No test files found" exit (no failures).
- [ ] **Step 3:** Commit `chore: add vitest for unit tests`.

### Task 1: Range- and ETag-aware media proxy, one shared S3 client

**Files:**
- Create: `src/shared/lib/media-range.ts`
- Modify: `src/app/api/media/[...key]/route.ts`, `src/shared/lib/storage.ts` (export the client, add R2-safe checksum options)
- Test: `src/shared/lib/media-range.test.ts`

**Interfaces:**
- Produces: `parseRange(header: string | null, size: number): { start: number; end: number } | "unsatisfiable" | null` (null = serve whole object); `export const s3Client` and `getObject(key, opts: { range?: string; ifNoneMatch?: string })` from `storage.ts`.

- [ ] **Step 1: Write failing tests** in `media-range.test.ts`:
  - `parseRange("bytes=0-1023", 5000)` → `{ start: 0, end: 1023 }`
  - `parseRange("bytes=4000-", 5000)` → `{ start: 4000, end: 4999 }`
  - `parseRange("bytes=-500", 5000)` → `{ start: 4500, end: 4999 }`
  - `parseRange("bytes=0-99999", 5000)` → `{ start: 0, end: 4999 }`
  - `parseRange("bytes=6000-", 5000)` → `"unsatisfiable"`
  - `parseRange("bytes=0-1,5-9", 5000)` → `null`; `parseRange("items=0-1", 5000)` → `null`; `parseRange(null, 5000)` → `null`
- [ ] **Step 2:** `npm test` → FAIL (module missing).
- [ ] **Step 3:** Implement `parseRange`. In the route, when a `Range` header is present: `HeadObjectCommand` for the size, `parseRange`, then `GetObject` with the normalised `Range: bytes=start-end`; respond `206` with `Content-Range: bytes start-end/size`, `Content-Length`, `Accept-Ranges: bytes`; `416` with `Content-Range: bytes */size` when unsatisfiable; forward `If-None-Match` to S3 and return `304` on `NotModified`; always send `ETag` and `Accept-Ranges: bytes`. The route imports the client from `storage.ts` instead of creating its own.
- [ ] **Step 4:** `npm test` → PASS. Then against dev server (3002):
  `curl -s -D - -o /dev/null -H "Range: bytes=0-1023" -H "Host: punjabi.localhost:3002" http://localhost:3002/api/media/<hero mp4 key>` → `206`, `content-range: bytes 0-1023/3657748`, `content-length: 1024`.
  Repeat with `If-None-Match: <etag from previous>` and no Range → `304`.
- [ ] **Step 5:** Commit `fix(media): byte ranges and conditional requests on /api/media`.

### Task 2: Per-store data cache module

**Files:**
- Create: `src/shared/lib/data-cache.ts`
- Test: `src/shared/lib/data-cache.test.ts`

**Interfaces:**
- Produces:
  - `storeTag(storeId: string): string` → `"store:<id>"`
  - `STORE_DOMAINS_TAG = "store-domains"`
  - `cachedForStore<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, opts: { tags: (...args: A) => string[] }): (...args: A) => Promise<R>` — wraps `unstable_cache` (key parts `[name, ...JSON args]`, `revalidate: 300`) and React `cache()` (per-request dedupe), and revives ISO strings under keys ending in `At` back to `Date`.
  - `reviveDates<T>(value: T): T`
  - `invalidateStore(storeId: string, opts?: { domains?: boolean }): void` — `revalidateTag(storeTag(id), { expire: 0 })`, plus `STORE_DOMAINS_TAG` when `domains`.

- [ ] **Step 1: Write failing tests:**
  - `storeTag("abc") === "store:abc"`
  - `reviveDates({ createdAt: "2026-10-16T10:30:04.246Z", name: "2026-10-16T10:30:04.246Z", items: [{ updatedAt: "2026-01-01T00:00:00.000Z" }] })` → `createdAt` and nested `updatedAt` are `Date`, `name` stays a string.
  - `invalidateStore("abc", { domains: true })` calls mocked `revalidateTag` with `("store:abc", { expire: 0 })` and `("store-domains", { expire: 0 })` (mock `next/cache` with `vi.mock`).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat(cache): per-store data cache helpers`.

### Task 3: Cache storefront reads and invalidate on every write

**Files:**
- Modify: `src/shared/lib/tenant.ts` (store by domain via `cachedForStore` with tags `[STORE_DOMAINS_TAG]` only: the storeId is not known before the lookup, so every store write invalidates with `{ domains: true }`)
- Modify: `src/features/categories/storefront.ts` (`getStoreCategories`, `getTopLevelCategoriesWithProducts` → `cachedForStore`, tags `[storeTag(storeId)]`)
- Create: `src/features/products/storefront.ts` (`getFeaturedProducts(storeId)`, `getNewArrivalProducts(storeId)` cached; `getProductBySlug(storeId, slug)` per-request `cache()` only)
- Modify: `src/app/(storefront)/(home)/page.tsx` to use the new cached product reads
- Modify (invalidate after a successful write): `src/features/stores/service.ts` (`create`, `update`, `delete` → `invalidateStore(id, { domains: true })`), `src/features/categories/service.ts` (`create`, `update`, `delete`), `src/features/products/service.ts` (`create`, `update`, `delete`), `src/features/reviews/service.ts` (`create` when auto-approved, `approve`, `reject`, `delete`), `src/features/orders/service.ts` (`create` after stock decrease, `updateStatus` after restock)
- Test: `src/features/cache-invalidation.test.ts`

**Interfaces:**
- Consumes: Task 2 `cachedForStore`, `storeTag`, `STORE_DOMAINS_TAG`, `invalidateStore`.
- Produces: `getFeaturedProducts`, `getNewArrivalProducts`, `getProductBySlug` from `@/features/products/storefront`.

- [ ] **Step 1: Write failing tests** (mock the repositories and `@/shared/lib/data-cache`): for each service method above, call it with a minimal valid input and assert `invalidateStore` was called with the right storeId (and `{ domains: true }` for store writes). One `it` per method.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Add the `invalidateStore` calls and the cached read wrappers; switch the home page to them.
- [ ] **Step 4:** `npm test` → PASS; `npx tsc --noEmit` clean; `npx eslint` on changed files clean.
- [ ] **Step 5: Measure** with the transaction-count method from the audit (`pg_stat_database.xact_commit` delta around a warm request on 3002): home page queries drop from ≈20 to ≤6 on the second request. Edit a category name in the admin, reload home → new name shows immediately.
- [ ] **Step 6:** Commit `feat(storefront): cache store, category and home product reads per store`.

### Task 4: Dedupe slug lookups between metadata and page

**Files:**
- Modify: `src/app/(storefront)/products/[slug]/page.tsx`, `src/app/(storefront)/categories/[slug]/page.tsx` (both `generateMetadata` and the page use `getProductBySlug` / a new `getCategoryBySlug = cache(...)` in `src/features/categories/storefront.ts`)

- [ ] **Step 1:** Replace the four direct `getBySlug` calls.
- [ ] **Step 2: Verify:** product page query count drops by 1+ (same measurement as Task 3); `tsc` clean.
- [ ] **Step 3:** Commit `perf(storefront): one slug lookup per product and category request`.

### Task 5: Service worker: no personal pages, bounded cache

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1:** Documents under `/cart`, `/checkout`, `/account`, `/orders` (and any URL with a `token` query) go network-only with the `/offline` fallback, never `cache.put`. Images and documents in `store-cache-*` are trimmed to the newest 60 entries after each put. Bump `CACHE_VERSION` to `v1.2.0` so `activate` deletes old caches that may hold personal pages.
- [ ] **Step 2: Verify with Playwright** (service workers allowed) on the production build: visit `/`, `/products`, `/cart`, `/account/login`; read `caches.open("store-cache-v1.2.0")` keys → contains `/` and `/products`, contains no `/cart` or `/account`. Register the old worker version first and confirm `store-cache-v1.1.08` is gone after the update.
- [ ] **Step 3:** Commit `fix(sw): never cache personal pages; cap the page cache`.

### Task 6: Cloudflare R2 for media

**Files:**
- Modify: `src/shared/lib/storage.ts` (R2-safe client options from Global Constraints; region from `S3_REGION`, default stays for dev)
- Modify: `next.config.ts` (images `unoptimized: true` always; R2 public host added to `remotePatterns` from `S3_PUBLIC_URL`)
- Modify: `src/app/robots.ts` (allow is fine; no change unless media moves off-site — leave)
- Create: `scripts/copy-media-to-r2.ts` (copies every object from a source bucket `SRC_S3_*` env to the destination `S3_*`, skipping keys that already exist with the same size; preserves `ContentType` and `CacheControl`; `--dry-run` lists counts and bytes)
- Create: `scripts/rewrite-media-urls.ts` + `src/shared/lib/media-url-rewrite.ts` (pure `rewriteMediaUrls(value: unknown, publicBase: string): unknown` that replaces a leading or embedded `/api/media/` path with `${publicBase}/` in strings, arrays and objects; the script applies it to every `text`/`jsonb` column in `stores`, `categories`, `products`, `product_images`, `users`, `reviews`, `announcements`; `--dry-run` prints per-column change counts; refuses to run without `S3_PUBLIC_URL`)
- Create: `.env.example` (all variables from `CLAUDE.md` plus the R2 values: `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET`, `S3_PUBLIC_URL=https://media.<domain>`)
- Create: `docs/deploy/cloudflare-r2.md` (bucket, custom domain, API token scope "Object Read & Write" on that bucket, CORS not required for `<img>/<video>`, then: copy objects → back up DB → rewrite URLs dry-run → run → deploy with env set)
- Test: `src/shared/lib/media-url-rewrite.test.ts`

- [ ] **Step 1: Write failing tests:**
  - `"/api/media/s1/products/a.webp"` → `"https://media.example.com/s1/products/a.webp"`
  - `{ url: "/api/media/k.webp", variants: { w400: "/api/media/k-w400.webp" } }` → both rewritten
  - `"https://images.unsplash.com/x.jpg"` unchanged; `null` unchanged; a value already rewritten unchanged (idempotent)
  - publicBase with trailing slash `"https://media.example.com/"` produces a single slash
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement the helper, both scripts, config and docs.
- [ ] **Step 4:** `npm test` → PASS. Dry-run both scripts against local RustFS/`ecommerce` (copy script with source = destination prints "0 to copy"; rewrite script with a fake `S3_PUBLIC_URL` prints counts and changes nothing). Do not run the rewrite for real locally.
- [ ] **Step 5:** Commit `feat(media): Cloudflare R2 support and migration scripts`.

### Task 7: Final verification and docs

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npx eslint` on all changed files → clean.
- [ ] **Step 2:** Production build + `next start` on a spare port: home, `/products`, a product, a category, cart, checkout render 200 on Punjabi and Shirts; hero video returns 206 on a ranged request; language switch still works (10 toggles).
- [ ] **Step 3:** Record the caching decision (per-store tags, 300s backstop, what is not cached, R2 as media CDN, single-instance limit of the built-in cache) in `docs/adr/0002-storefront-caching-and-r2-media.md`.
- [ ] **Step 4:** Commit `docs: ADR for storefront caching and R2 media`.

## Known limit (not in scope)

`unstable_cache` stores entries on the local filesystem of each Next.js process. With more than one app instance, `revalidateTag` only clears the instance that handled the admin save; a shared cache handler (e.g. Redis) would be needed then. The ADR records this.

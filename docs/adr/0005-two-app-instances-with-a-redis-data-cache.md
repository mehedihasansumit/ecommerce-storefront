---
status: accepted
date: 2026-11-07
---

# Two app instances sharing one data cache in Redis

A load test on the 2-core VPS (k6, storefront pages) topped out at ~16 pages per
second: the Next.js process sat at 100% of one core while Postgres stayed under
14% and the second core was mostly idle. Node renders on one core, so we run
two app instances behind Nginx. ADR 0002's data cache lived inside each process,
so with two instances an admin save only cleared the instance that handled it.
We decided to move that cache to Redis through a custom Next.js `cacheHandler`
(`cache-handler.mjs`), so `revalidateTag` on either instance clears it for both.

## How it works

- Cached entries are Redis strings `nc:<buildId>:<key>` with a 24h TTL. Tag
  expiries live in one hash `nc:tags` with no TTL; Redis runs
  `maxmemory-policy volatile-lru`, so it may evict entries but never an expiry.
- The build id in the key means a deploy never serves data cached by the
  previous build's code, the same as the per-container disk cache did.
- Redis is a cache only (`--save ""`, no AOF). Losing it costs one cold render
  per key.
- Fails open: if Redis is unreachable, reads miss (pages render from Postgres)
  and writes are dropped. Errors are logged at most every 30s.
- Without `REDIS_URL` (local dev, `next build`) the handler keeps entries in
  process memory, which is the old one-instance behaviour.
- Each instance's Postgres pool is `DB_POOL_MAX=8`: 16 of `max_connections=30`.
- Verified end to end: renaming a category through instance A shows the new name
  on instance B on the next request; with the old cache, B kept the old name.

## Considered options

- **Postgres tables as the shared cache:** no new container, but every cache
  read becomes a DB round trip on the database we are trying to spare. Started,
  then replaced by Redis at the owner's request.
- **Redis cache-handler package:** less code of our own, but the handler API
  changes between Next majors and the packages trail it. The interface we need
  (`get`/`set`/`revalidateTag`) is small.
- **Page caching (ISR) instead of more instances:** the larger win, but pages
  are per-Host and read cookies; see ADR 0002. Still open.

## Consequences

- One more container (`ecommerce-redis`, 128 MB cap) on the VPS.
- The app no longer pins `HOSTNAME=127.0.0.1`: Next's internal rewrite then
  targets another host and every storefront page 307-loops to itself. The app
  ports (5001, 5002) must be closed by the firewall instead.
- Anything else kept in process memory is per-instance. Today that is only
  React `cache()` (per request), so nothing else needed to move.

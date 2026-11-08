---
status: accepted
date: 2026-11-08
---

# Visit tracking runs in its own small server, outside Next.js

With Cloudflare caching pages and prefetches (docs/deploy/cloudflare-page-cache.md),
almost the only storefront request left reaching the server is `POST /api/track`,
sent once per product view, add to cart and search. Measured on the 2-core VPS at
200 requests/s: the Next route cost ~3.7 ms of CPU each, of which ~2.5 ms is
Next.js's own per-request overhead (a static route with no work costs the same).
That caps tracking near 500 requests/s however lean the route is. We moved
`/api/track` to a plain Node HTTP server, `tracker/server.mjs`, which Nginx
routes the path to.

## How it works

- Same image, own container (`ecommerce-tracker`, loopback port 5003). Its two
  dependencies (`postgres`, `jose`) are installed in their own Docker stage,
  because Next bundles the app's copies into its build.
- Store from the Host header via an in-memory domain map, reloaded from the
  `stores` table every minute (and on an unknown host, at most every 10 s).
- Customer from `customer-token`, verified with JWT_SECRET, counted only when
  its store matches (as `getCustomerToken` does).
- Validation mirrors `trackEventSchema` and `AnalyticsService.track`
  (`tracker/core.mjs`, tested in `src/shared/lib/tracker-core.test.ts`).
- Events are buffered and written in one INSERT every 2 s (up to 1000 rows);
  SIGTERM flushes before exit.
- Nginx sends `/api/track` to the tracker with the two app instances as
  `backup`, so if the tracker is down the Next route answers as before.
- Measured locally: 1000 requests/s at ~20-25% of one core, 2000/s at ~40%,
  every event saved. Expect roughly double on the VPS.

## Also fixed

`product_id` and `category_id` are uuid columns, and events are saved in one
multi-row INSERT, so one event with a non-uuid id failed the whole batch and
lost every view in it. Both the tracker and `trackEventSchema` now reject such
events individually.

## Considered options

- **Make the Next route leaner:** the ~2.5 ms Next.js floor stays.
- **Nginx writes events to a log file, a job loads it:** Nginx would have to
  log the login cookie to resolve the customer, and logging tokens to disk is a
  risk. Also more moving parts than one small server.
- **Batch events in the browser:** tested; events were lost when a full page
  load dropped the beacon sent during unload.
- **Sample views:** breaks unique-visitor counts.

## Consequences

- Two implementations of the tracking rules (the tracker and the Next fallback
  route). Change both together.
- One more container. Logs: `docker logs ecommerce-tracker`.
- Up to 2 s of events can be lost if the tracker is killed without SIGTERM.

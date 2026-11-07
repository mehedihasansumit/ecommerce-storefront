# Cloudflare page cache for logged-out visitors

Every storefront page is rendered by Next.js on each request (`cache-control:
private, no-store`), and two app instances top out at ~26 pages/s. Most visitors
are logged out and see the same HTML for a given URL, so Cloudflare can keep a
copy for 60 seconds and serve it from its edge: 500 people opening the homepage
at once cost the server one render instead of 500.

## Why it is safe (checked 2026-11-07)

- **Logged-out HTML is the same for everyone.** Two anonymous fetches of the
  homepage differ only in the script Cloudflare itself injects per response.
  Language is in the URL (`/bn`), the cart and theme live in the browser, and
  the only cookie reads in storefront pages are the login token (pages that
  personalise for a logged-in customer), which the rule below bypasses.
- **No storefront page sets a cookie**, so a cached copy hands no cookie to
  strangers.
- **RSC payloads never land under a page URL.** Next answers a page URL with
  its RSC payload instead of HTML when sent `RSC: 1`, and Cloudflare ignores the
  `Vary: rsc` header. Next's router always adds `?_rsc=<hash>` to those
  requests; the rule skips them, and Nginx refuses a bare `RSC: 1` request with
  400 (see `nginx-two-instances.md`), which Cloudflare does not cache.
  **The Nginx guard must be live before the rule is turned on.** Next strips the
  header before the app's proxy runs, so the app cannot do this check itself.

## What a shopper may see

Prices, stock and admin edits can show up to 60 seconds late on cached pages.
Checkout still checks stock and prices against the database, so the worst case
is "Insufficient stock" at checkout for an item that just sold out.

## The rule

Cloudflare dashboard → lourhaus.com → **Caching → Cache Rules → Create rule**.

Name: `Storefront pages for logged-out visitors`

**When incoming requests match** (Edit expression):

```
(http.host in {"www.lourhaus.com" "lourhaus.com"})
and http.request.method eq "GET"
and not starts_with(http.request.uri.path, "/api/")
and not starts_with(http.request.uri.path, "/admin")
and not starts_with(http.request.uri.path, "/_next/")
and not http.request.uri.path in {"/cart" "/checkout" "/bn/cart" "/bn/checkout"}
and not starts_with(http.request.uri.path, "/account")
and not starts_with(http.request.uri.path, "/bn/account")
and not starts_with(http.request.uri.path, "/orders")
and not starts_with(http.request.uri.path, "/bn/orders")
and not http.request.uri.query contains "_rsc="
and not http.cookie contains "customer-token="
and not http.cookie contains "admin-token="
```

**Then:**

- Cache eligibility: **Eligible for cache**
- Edge TTL: **Ignore cache-control header and use this TTL → 1 minute**
- Browser TTL: **Respect origin** (browsers keep asking Cloudflare, which answers
  from its copy)
- Leave everything else at the defaults.

Deploy the rule.

## Check

```sh
curl -sI https://www.lourhaus.com/ | grep -i cf-cache-status   # first: MISS, then HIT
curl -sI https://www.lourhaus.com/ | grep -i cf-cache-status   # HIT
curl -sI -H 'Cookie: customer-token=x' https://www.lourhaus.com/ | grep -i cf-cache-status   # DYNAMIC
curl -s -o /dev/null -w '%{http_code}\n' -H 'RSC: 1' https://www.lourhaus.com/products   # 400
```

To undo: disable the rule. Nothing in the app depends on it.

## Later

- Product pages could get a shorter TTL (a second rule matching `/products/`
  with 30 seconds) if a minute of stale stock is too long during a sale.
- Admin saves could purge the Cloudflare cache through its API (needs an API
  token in `.env.production`), so edits show immediately.
- Client-side navigation (`?_rsc=` requests) still reaches the server. Next
  builds the `_rsc` hash from every header the payload depends on, so those
  could be cached too; left out of the first rollout to keep it simple.

import { cache } from "react";
import { revalidateTag, unstable_cache } from "next/cache";

/**
 * Cross-request cache for storefront reads that change rarely (store config,
 * categories, home product rows). Entries are tagged per store and expired by
 * `invalidateStore` from every service write for that store; `REVALIDATE_SECONDS`
 * is the backstop for a write path that misses it. Stock- and price-sensitive
 * reads (product detail, /products) are not cached here.
 */

const REVALIDATE_SECONDS = 300;

/** Tag on every cached read that belongs to one store. */
export function storeTag(storeId: string): string {
  return `store:${storeId}`;
}

/** Tag on store-by-domain lookups (the store id is unknown before the lookup). */
export const STORE_DOMAINS_TAG = "store-domains";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * The data cache stores JSON, so Dates come back as strings. Restores ISO strings
 * under keys ending in "At" (createdAt, updatedAt, …) to Dates, at any depth.
 */
export function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => reviveDates(v)) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] =
        k.endsWith("At") && typeof v === "string" && ISO_DATE.test(v)
          ? new Date(v)
          : reviveDates(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Wraps a read in the cross-request data cache (keyed by name + arguments, tagged
 * by `opts.tags`) and in React `cache()`, so one request runs it at most once.
 */
export function cachedForStore<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>,
  opts: { tags: (...args: A) => string[] }
): (...args: A) => Promise<R> {
  return cache(async (...args: A) => {
    const cached = unstable_cache(() => fn(...args), [name, JSON.stringify(args)], {
      tags: opts.tags(...args),
      revalidate: REVALIDATE_SECONDS,
    });
    return reviveDates(await cached());
  });
}

/**
 * Expires every cached read for a store; `domains` also expires domain lookups.
 * Outside a Next.js request (seed and migration scripts) there is no cache to
 * expire and `revalidateTag` throws, so that case is ignored.
 */
export function invalidateStore(storeId: string, opts: { domains?: boolean } = {}): void {
  const tags = opts.domains ? [storeTag(storeId), STORE_DOMAINS_TAG] : [storeTag(storeId)];
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch {
      // Not in a request: nothing cached to expire.
    }
  }
}

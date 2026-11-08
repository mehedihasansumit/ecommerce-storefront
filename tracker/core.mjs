// @ts-check
/**
 * Visit tracker logic (ADR 0006), kept free of I/O so it can be tested.
 *
 * Mirrors POST /api/track in the Next app (src/app/api/track/route.ts, which
 * stays as the fallback): the store comes from the Host, the customer from a
 * valid customer-token for that store, and events are validated like
 * trackEventSchema + AnalyticsService.track.
 */

export const MAX_EVENTS_PER_REQUEST = 20;
const EVENT_TYPES = new Set(["product_view", "search", "add_to_cart"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** @typedef {{ storeId: string, eventType: string, productId: string | null, productName: string | null, categoryId: string | null, searchQuery: string | null, sessionId: string | null, userId: string | null }} TrackRow */

/**
 * `Host` header → hostname as stores list it (lowercase, no port).
 * @param {string | undefined} host
 */
export function hostnameOf(host) {
  return String(host || "").split(":")[0].trim().toLowerCase();
}

/**
 * Builds hostname → storeId from `stores` rows (active stores only).
 * @param {Iterable<{ id: string, domains: string[] | null }>} rows
 */
export function buildDomainMap(rows) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const row of rows) {
    for (const d of row.domains ?? []) map.set(String(d).trim().toLowerCase(), row.id);
  }
  return map;
}

/**
 * One cookie's value from a Cookie header, or null.
 * @param {string | undefined} header
 * @param {string} name
 */
export function readCookie(header, name) {
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * The customer's id if the verified token payload belongs to this store.
 * @param {Record<string, unknown> | null | undefined} payload
 * @param {string} storeId
 * @returns {string | null}
 */
export function customerIdFor(payload, storeId) {
  if (!payload || payload.type !== "customer" || payload.storeId !== storeId) return null;
  return typeof payload.userId === "string" && UUID.test(payload.userId) ? payload.userId : null;
}

/**
 * A string within `max` characters, or null when absent; `undefined` when invalid.
 * @param {unknown} v
 * @param {number} max
 * @returns {string | null | undefined}
 */
function optString(v, max) {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string" || v.length > max) return undefined;
  return v;
}

/**
 * @param {unknown} v
 * @returns {string | null | undefined}
 */
function optUuid(v) {
  if (v === undefined || v === null) return null;
  return typeof v === "string" && UUID.test(v) ? v : undefined;
}

/**
 * The events from a request body (`{ events: [...] }` or one event object) as
 * rows to save. Invalid events are skipped, like the Next route does. Returns
 * null when the request itself is malformed (400).
 * @param {any} body
 * @param {string} storeId
 * @param {string | null} userId
 * @returns {TrackRow[] | null}
 */
export function parseEvents(body, storeId, userId) {
  const raw = Array.isArray(body?.events) ? body.events : body && typeof body === "object" ? [body] : null;
  if (!raw || raw.length === 0 || raw.length > MAX_EVENTS_PER_REQUEST) return null;

  /** @type {TrackRow[]} */
  const rows = [];
  for (const e of raw) {
    if (!e || typeof e !== "object" || !EVENT_TYPES.has(e.eventType)) continue;
    const productId = optUuid(e.productId);
    const categoryId = optUuid(e.categoryId);
    const productName = optString(e.productName, 300);
    const searchQuery = optString(e.searchQuery, 200);
    const sessionId = optString(e.sessionId, 64);
    if ([productId, categoryId, productName, searchQuery, sessionId].includes(undefined)) continue;
    if ((e.eventType === "product_view" || e.eventType === "add_to_cart") && !productId) continue;
    if (e.eventType === "search" && !searchQuery?.trim()) continue; // empty searches are dropped
    rows.push({
      storeId,
      eventType: e.eventType,
      productId: productId ?? null,
      productName: productName || null,
      categoryId: categoryId ?? null,
      searchQuery: searchQuery || null,
      sessionId: sessionId || null,
      userId,
    });
  }
  return rows;
}

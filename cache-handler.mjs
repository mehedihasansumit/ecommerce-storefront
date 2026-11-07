// @ts-check
/**
 * Next.js cache handler shared by every app instance (ADR 0005).
 *
 * Next's built-in handler keeps cached data and tag expiries inside one
 * process, so with two instances an admin save would only clear the instance
 * that handled it. This handler keeps both in Redis, so `revalidateTag` on one
 * instance is seen by all of them.
 *
 * - REDIS_URL set   → Redis (production).
 * - REDIS_URL unset → in-process memory, same behaviour as one instance today
 *                     (local dev, `next build`).
 *
 * Fails open: if Redis is down, reads are cache misses (pages render from the
 * database) and writes are dropped. Entries carry the build id in their key,
 * so a deploy never serves data cached by the previous build's code.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import Redis from "ioredis";

const TAGS_HEADER = "x-next-cache-tags";
const ENTRY_TTL_SECONDS = 24 * 60 * 60;
const TAGS_KEY = "nc:tags";
const PAGE_KINDS = new Set(["APP_PAGE", "APP_ROUTE", "PAGES"]);

/** @typedef {{ stale?: number, expired?: number }} TagTimes */
/**
 * @typedef {object} CacheStore
 * @property {(key: string) => Promise<string | null>} getEntry
 * @property {(key: string, text: string, ttlSeconds: number) => Promise<void>} setEntry
 * @property {(key: string) => Promise<void>} deleteEntry
 * @property {(tags: string[]) => Promise<(TagTimes | null)[]>} getTagTimes
 * @property {(times: Map<string, TagTimes>) => Promise<void>} setTagTimes
 */

// ---------- serialization (page entries hold Buffers and Maps) ----------

const BUF = "$$nextCacheBuffer";
const MAP = "$$nextCacheMap";

/** @param {unknown} value */
export function encode(value) {
  return JSON.stringify(value, function (key, v) {
    const raw = this[key];
    if (Buffer.isBuffer(raw)) return { [BUF]: raw.toString("base64") };
    if (raw instanceof Map) return { [MAP]: [...raw.entries()] };
    return v;
  });
}

/** @param {string} text */
export function decode(text) {
  return JSON.parse(text, (_key, v) => {
    if (v && typeof v === "object") {
      if (typeof v[BUF] === "string") return Buffer.from(v[BUF], "base64");
      if (Array.isArray(v[MAP])) return new Map(v[MAP]);
    }
    return v;
  });
}

// ---------- stores ----------

/** @returns {CacheStore} */
export function memoryStore() {
  /** @type {Map<string, { text: string, expiresAt: number }>} */
  const entries = new Map();
  /** @type {Map<string, TagTimes>} */
  const tags = new Map();
  return {
    async getEntry(key) {
      const e = entries.get(key);
      if (!e) return null;
      if (e.expiresAt <= Date.now()) {
        entries.delete(key);
        return null;
      }
      return e.text;
    },
    async setEntry(key, text, ttlSeconds) {
      entries.set(key, { text, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async deleteEntry(key) {
      entries.delete(key);
    },
    async getTagTimes(list) {
      return list.map((t) => tags.get(t) ?? null);
    },
    async setTagTimes(times) {
      for (const [t, v] of times) tags.set(t, v);
    },
  };
}

/**
 * Entries expire on their own (TTL); the tag hash has no TTL, so Redis'
 * `volatile-lru` policy can evict old entries but never a tag expiry.
 * @param {Redis} client
 * @returns {CacheStore}
 */
export function redisStore(client) {
  return {
    async getEntry(key) {
      return client.get(key);
    },
    async setEntry(key, text, ttlSeconds) {
      await client.set(key, text, "EX", ttlSeconds);
    },
    async deleteEntry(key) {
      await client.del(key);
    },
    async getTagTimes(list) {
      if (list.length === 0) return [];
      const raw = await client.hmget(TAGS_KEY, ...list);
      return raw.map((r) => (r ? JSON.parse(r) : null));
    },
    async setTagTimes(times) {
      if (times.size === 0) return;
      const fields = [];
      for (const [t, v] of times) fields.push(t, JSON.stringify(v));
      await client.hset(TAGS_KEY, ...fields);
    },
  };
}

// ---------- handler ----------

let lastLog = 0;
/** At most one log line per 30s, so a Redis outage doesn't flood the logs. */
function logError(/** @type {string} */ what, /** @type {unknown} */ err) {
  const now = Date.now();
  if (now - lastLog < 30_000) return;
  lastLog = now;
  console.error(`[cache-handler] ${what} failed:`, err instanceof Error ? err.message : err);
}

/** @param {any} value */
function headerTags(value) {
  if (!value || !PAGE_KINDS.has(value.kind)) return [];
  const header = value.headers?.[TAGS_HEADER];
  return typeof header === "string" ? header.split(",").filter(Boolean) : [];
}

/** @param {string | undefined} serverDistDir */
function readBuildId(serverDistDir) {
  if (!serverDistDir) return "dev";
  try {
    return readFileSync(path.join(serverDistDir, "..", "BUILD_ID"), "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
}

/**
 * Builds the handler class around a store. Next creates a handler per request,
 * so the store (and its Redis connection) lives outside the class.
 * @param {() => CacheStore} getStore
 */
export function createCacheHandler(getStore) {
  /** @type {string | undefined} */
  let prefix;

  return class SharedCacheHandler {
    /** @param {{ serverDistDir?: string }} [ctx] */
    constructor(ctx) {
      prefix ??= `nc:${readBuildId(ctx?.serverDistDir)}:`;
      this.store = getStore();
    }

    /**
     * @param {string} key
     * @param {any} ctx
     */
    async get(key, ctx) {
      try {
        const text = await this.store.getEntry(prefix + key);
        if (!text) return null;
        const entry = decode(text);

        const tags = new Set([...(entry.tags ?? []), ...headerTags(entry.value)]);
        if (ctx?.kind === "FETCH") {
          for (const t of [...(ctx.tags ?? []), ...(ctx.softTags ?? [])]) tags.add(t);
        }

        let stale = false;
        if (tags.size > 0) {
          const now = Date.now();
          for (const times of await this.store.getTagTimes([...tags])) {
            if (!times) continue;
            const { expired, stale: staleAt } = times;
            // Expired after this entry was written → treat as a miss.
            if (typeof expired === "number" && expired <= now && expired > entry.lastModified) {
              return null;
            }
            if (typeof staleAt === "number" && staleAt > entry.lastModified) stale = true;
          }
        }

        // lastModified 0 makes Next see the entry as past its revalidate time:
        // it serves it once and refreshes in the background.
        return { lastModified: stale ? 0 : entry.lastModified, value: entry.value };
      } catch (err) {
        logError("get", err);
        return null;
      }
    }

    /**
     * @param {string} key
     * @param {any} data
     * @param {any} ctx
     */
    async set(key, data, ctx) {
      try {
        if (!data) {
          await this.store.deleteEntry(prefix + key);
          return;
        }
        const tags =
          data.kind === "FETCH" ? (ctx?.fetchCache ? (ctx.tags ?? []) : []) : headerTags(data);
        const text = encode({ value: data, tags, lastModified: Date.now() });
        await this.store.setEntry(prefix + key, text, ENTRY_TTL_SECONDS);
      } catch (err) {
        logError("set", err);
      }
    }

    /**
     * Same rules as Next's built-in handler: with `durations` the tag goes
     * stale now and expires after `durations.expire` seconds; without, it
     * expires now.
     * @param {string | string[]} tags
     * @param {{ expire?: number }} [durations]
     */
    async revalidateTag(tags, durations) {
      const list = typeof tags === "string" ? [tags] : tags;
      if (list.length === 0) return;
      try {
        const now = Date.now();
        const existing = await this.store.getTagTimes(list);
        /** @type {Map<string, TagTimes>} */
        const updates = new Map();
        list.forEach((tag, i) => {
          const next = { ...(existing[i] ?? {}) };
          if (durations) {
            next.stale = now;
            if (durations.expire !== undefined) next.expired = now + durations.expire * 1000;
          } else {
            next.expired = now;
          }
          updates.set(tag, next);
        });
        await this.store.setTagTimes(updates);
      } catch (err) {
        logError(`revalidateTag(${list.join(",")})`, err);
      }
    }

    resetRequestCache() {}
  };
}

/** @type {CacheStore | undefined} */
let defaultStore;

function getDefaultStore() {
  if (defaultStore) return defaultStore;
  const url = process.env.REDIS_URL;
  if (!url) return (defaultStore = memoryStore());

  const client = new Redis(url, {
    enableOfflineQueue: false, // fail fast while disconnected instead of queueing
    maxRetriesPerRequest: 1,
    commandTimeout: 1000,
    connectTimeout: 2000,
  });
  client.on("error", (err) => logError("redis connection", err));
  return (defaultStore = redisStore(client));
}

export default createCacheHandler(getDefaultStore);

import Redis from "ioredis";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Attempt limits for public endpoints (login, register, order tracking, coupon
 * checks, checkout). Counts live in Redis, so both app instances share them;
 * without REDIS_URL (local dev) they live in this process's memory.
 *
 * Fails open: if Redis is unreachable the request is allowed, so a Redis outage
 * never locks shoppers out of logging in or checking out.
 */

export type RateRule = {
  /** Short stable name, part of the Redis key. */
  name: string;
  /** Attempts allowed per window. */
  limit: number;
  windowSeconds: number;
};

/**
 * The limits. Per-IP limits are generous because many Bangladeshi mobile users
 * share one carrier IP (CGNAT); the tight limits are per account / phone / email.
 */
export const RATE_RULES = {
  adminLoginIp: { name: "admin-login-ip", limit: 20, windowSeconds: 15 * 60 },
  adminLoginEmail: { name: "admin-login-email", limit: 5, windowSeconds: 15 * 60 },
  loginIp: { name: "login-ip", limit: 30, windowSeconds: 15 * 60 },
  loginEmail: { name: "login-email", limit: 5, windowSeconds: 15 * 60 },
  registerIp: { name: "register-ip", limit: 10, windowSeconds: 60 * 60 },
  trackIp: { name: "track-ip", limit: 30, windowSeconds: 10 * 60 },
  trackPhone: { name: "track-phone", limit: 10, windowSeconds: 10 * 60 },
  couponIp: { name: "coupon-ip", limit: 30, windowSeconds: 10 * 60 },
  checkoutIp: { name: "checkout-ip", limit: 30, windowSeconds: 10 * 60 },
  checkoutPhone: { name: "checkout-phone", limit: 5, windowSeconds: 10 * 60 },
  subscribeIp: { name: "subscribe-ip", limit: 10, windowSeconds: 60 * 60 },
  uploadUser: { name: "upload-user", limit: 30, windowSeconds: 60 * 60 },
} satisfies Record<string, RateRule>;

export type RateResult = { ok: boolean; retryAfterSeconds: number };

interface CounterStore {
  /** Adds one hit; returns the count in the current window and seconds left in it. */
  hit(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }>;
}

export function memoryCounterStore(now: () => number = Date.now): CounterStore {
  const counters = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, windowSeconds) {
      const t = now();
      let c = counters.get(key);
      if (!c || c.resetAt <= t) {
        c = { count: 0, resetAt: t + windowSeconds * 1000 };
        counters.set(key, c);
      }
      c.count += 1;
      if (counters.size > 10_000) {
        for (const [k, v] of counters) if (v.resetAt <= t) counters.delete(k);
      }
      return { count: c.count, ttl: Math.ceil((c.resetAt - t) / 1000) };
    },
  };
}

function redisCounterStore(client: Redis): CounterStore {
  return {
    async hit(key, windowSeconds) {
      // INCR, and start the window's clock on the first hit only.
      const [[, count], , [, ttl]] = (await client
        .multi()
        .incr(key)
        .expire(key, windowSeconds, "NX")
        .ttl(key)
        .exec()) as [[null, number], [null, number], [null, number]];
      return { count, ttl: ttl > 0 ? ttl : windowSeconds };
    },
  };
}

let store: CounterStore | undefined;

function getStore(): CounterStore {
  if (store) return store;
  const url = process.env.REDIS_URL;
  if (!url) return (store = memoryCounterStore());
  const client = new Redis(url, {
    // Queue while (re)connecting, so the first attempts after a start are still
    // counted; commandTimeout caps the wait, after which the request is allowed.
    enableOfflineQueue: true,
    maxRetriesPerRequest: 1,
    commandTimeout: 500,
    connectTimeout: 2000,
  });
  client.on("error", () => {}); // logged by the failed hit below; fails open
  return (store = redisCounterStore(client));
}

/** For tests: use a given store. */
export function setCounterStoreForTests(s: CounterStore | undefined): void {
  store = s;
}

/**
 * Counts one attempt for `subject` (an IP, an email, a phone) under `rule`.
 * `ok: false` once the limit for the current window is passed.
 */
export async function hitRateLimit(rule: RateRule, subject: string): Promise<RateResult> {
  if (!subject) return { ok: true, retryAfterSeconds: 0 };
  const key = `rl:${rule.name}:${subject.trim().toLowerCase()}`;
  try {
    const { count, ttl } = await getStore().hit(key, rule.windowSeconds);
    return count > rule.limit ? { ok: false, retryAfterSeconds: ttl } : { ok: true, retryAfterSeconds: 0 };
  } catch (err) {
    console.error("[rate-limit] counter unavailable, allowing request:", err instanceof Error ? err.message : err);
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/**
 * Checks several limits for one request (e.g. per IP and per email); every one
 * is counted, and the request is refused if any is over.
 */
export async function checkRateLimits(checks: [RateRule, string | null | undefined][]): Promise<RateResult> {
  const results = await Promise.all(checks.map(([rule, subject]) => hitRateLimit(rule, subject ?? "")));
  const blocked = results.filter((r) => !r.ok);
  if (blocked.length === 0) return { ok: true, retryAfterSeconds: 0 };
  return { ok: false, retryAfterSeconds: Math.max(...blocked.map((r) => r.retryAfterSeconds)) };
}

/** 429 with a Retry-After header and a message the forms can show as is. */
export function tooManyRequestsResponse(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return NextResponse.json(
    { error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) } },
  );
}

/**
 * The visitor's IP. Nginx sets X-Real-IP from its own view of the connection
 * (with Cloudflare's CF-Connecting-IP restored by the real_ip module, see
 * docs/deploy/nginx-two-instances.md), overwriting anything the client sent.
 * X-Forwarded-For's first entry is client-controlled, so it is only a fallback
 * for setups without Nginx (local dev).
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  return (
    headers.get("x-real-ip")?.trim() ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    ""
  );
}

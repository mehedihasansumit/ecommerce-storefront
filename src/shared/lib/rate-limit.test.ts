import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  checkRateLimits,
  getClientIp,
  hitRateLimit,
  memoryCounterStore,
  setCounterStoreForTests,
  tooManyRequestsResponse,
} from "./rate-limit";

let now = 1_000_000;
beforeEach(() => {
  now = 1_000_000;
  setCounterStoreForTests(memoryCounterStore(() => now));
});
afterEach(() => setCounterStoreForTests(undefined));

const rule = { name: "t", limit: 3, windowSeconds: 60 };

describe("rate limit", () => {
  it("allows up to the limit, then refuses with the time left", async () => {
    for (let i = 0; i < 3; i++) expect((await hitRateLimit(rule, "1.2.3.4")).ok).toBe(true);
    now += 20_000;
    const blocked = await hitRateLimit(rule, "1.2.3.4");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(40);
  });

  it("starts fresh after the window", async () => {
    for (let i = 0; i < 4; i++) await hitRateLimit(rule, "1.2.3.4");
    now += 61_000;
    expect((await hitRateLimit(rule, "1.2.3.4")).ok).toBe(true);
  });

  it("counts each subject separately, ignoring case", async () => {
    for (let i = 0; i < 3; i++) await hitRateLimit(rule, "A@x.com");
    expect((await hitRateLimit(rule, "a@x.com")).ok).toBe(false);
    expect((await hitRateLimit(rule, "b@x.com")).ok).toBe(true);
  });

  it("several limits: refused if any one is over", async () => {
    const perEmail = { name: "e", limit: 1, windowSeconds: 60 };
    expect((await checkRateLimits([[rule, "ip"], [perEmail, "a@x.com"]])).ok).toBe(true);
    expect((await checkRateLimits([[rule, "ip"], [perEmail, "a@x.com"]])).ok).toBe(false);
    expect((await checkRateLimits([[rule, "ip"], [perEmail, "b@x.com"]])).ok).toBe(true);
  });

  it("fails open when the counter store is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    setCounterStoreForTests({ hit: () => Promise.reject(new Error("redis down")) });
    expect((await hitRateLimit(rule, "1.2.3.4")).ok).toBe(true);
  });

  it("429 response carries Retry-After and a readable message", async () => {
    const res = tooManyRequestsResponse(90);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("90");
    expect((await res.json()).error).toBe("Too many attempts. Please try again in 2 minutes.");
  });

  it("client IP comes from X-Real-IP (set by nginx), not the spoofable X-Forwarded-For", () => {
    const req = new NextRequest("http://x", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "6.6.6.6, 203.0.113.7" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });
});

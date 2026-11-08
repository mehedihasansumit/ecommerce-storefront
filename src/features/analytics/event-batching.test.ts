import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const trackMany = vi.fn();
vi.mock("./repository", () => ({ AnalyticsRepository: { trackMany: (e: unknown[]) => trackMany(e) } }));
vi.mock("@/shared/lib/tenant", () => ({ getStoreId: async () => "s1" }));
vi.mock("@/shared/lib/auth", () => ({ getCustomerToken: async () => null }));

const { AnalyticsService, flushEvents } = await import("./service");
const { POST } = await import("@/app/api/track/route");

const view = (id: string) => ({ storeId: "s1", eventType: "product_view" as const, productId: id, productName: "P" });
const post = (body: unknown) =>
  POST(new NextRequest("http://x/api/track", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  vi.useFakeTimers();
  trackMany.mockReset().mockResolvedValue(undefined);
});
afterEach(async () => {
  await flushEvents();
  vi.useRealTimers();
});

describe("analytics events are written in batches", () => {
  it("many events become one INSERT after the flush delay", async () => {
    for (let i = 0; i < 5; i++) await AnalyticsService.track(view(`p${i}`));
    expect(trackMany).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);
    expect(trackMany).toHaveBeenCalledTimes(1);
    expect(trackMany.mock.calls[0][0]).toHaveLength(5);
  });

  it("a full buffer is written straight away", async () => {
    for (let i = 0; i < 500; i++) await AnalyticsService.track(view(`p${i}`));
    await Promise.resolve();
    expect(trackMany).toHaveBeenCalledTimes(1);
    expect(trackMany.mock.calls[0][0]).toHaveLength(500);
  });

  it("a failed write is dropped, not retried forever", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    trackMany.mockRejectedValueOnce(new Error("db down"));
    await AnalyticsService.track(view("p1"));
    await vi.advanceTimersByTimeAsync(2000);
    await AnalyticsService.track(view("p2"));
    await vi.advanceTimersByTimeAsync(2000);
    expect(trackMany.mock.calls[1][0]).toEqual([expect.objectContaining({ productId: "p2" })]);
  });
});

describe("POST /api/track", () => {
  it("accepts a batch and counts every valid event, with the store from the request", async () => {
    const res = await post({
      events: [
        { eventType: "product_view", productId: "a", productName: "A", storeId: "attacker-store" },
        { eventType: "search", searchQuery: "punjabi" },
        { eventType: "not-a-type" },
      ],
    });
    expect(res.status).toBe(202);
    await flushEvents();
    const saved = trackMany.mock.calls[0][0];
    expect(saved).toHaveLength(2);
    expect(saved.every((e: { storeId: string }) => e.storeId === "s1")).toBe(true);
  });

  it("still accepts the old single-event body", async () => {
    expect((await post({ eventType: "product_view", productId: "a", productName: "A" })).status).toBe(202);
    await flushEvents();
    expect(trackMany.mock.calls[0][0]).toHaveLength(1);
  });

  it("refuses an oversized batch", async () => {
    const events = Array.from({ length: 21 }, (_, i) => ({ eventType: "product_view", productId: `p${i}` }));
    expect((await post({ events })).status).toBe(400);
  });
});

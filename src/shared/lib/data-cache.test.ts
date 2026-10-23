import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
  unstable_cache: <T>(fn: T) => fn,
}));

import { invalidateStore, reviveDates, storeTag, STORE_DOMAINS_TAG } from "./data-cache";

describe("storeTag", () => {
  it("prefixes the store id", () => {
    expect(storeTag("abc")).toBe("store:abc");
  });
});

describe("reviveDates", () => {
  it("turns ISO strings under *At keys back into Dates, nested too", () => {
    const out = reviveDates({
      createdAt: "2026-10-16T10:30:04.246Z",
      name: "2026-10-16T10:30:04.246Z",
      items: [{ updatedAt: "2026-01-01T00:00:00.000Z" }],
    });
    expect(out.createdAt).toBeInstanceOf(Date);
    expect((out.createdAt as unknown as Date).toISOString()).toBe("2026-10-16T10:30:04.246Z");
    expect(out.items[0].updatedAt).toBeInstanceOf(Date);
    expect(out.name).toBe("2026-10-16T10:30:04.246Z");
  });

  it("leaves non-date values under *At keys alone", () => {
    expect(reviveDates({ sentAt: null, lastAt: "soon" })).toEqual({ sentAt: null, lastAt: "soon" });
  });
});

describe("invalidateStore", () => {
  beforeEach(() => revalidateTag.mockClear());

  it("expires the store tag immediately", () => {
    invalidateStore("abc");
    expect(revalidateTag).toHaveBeenCalledWith("store:abc", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledTimes(1);
  });

  it("also expires domain lookups when asked", () => {
    invalidateStore("abc", { domains: true });
    expect(revalidateTag).toHaveBeenCalledWith("store:abc", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(STORE_DOMAINS_TAG, { expire: 0 });
  });

  it("does not throw outside a Next.js request (scripts, seeds)", () => {
    revalidateTag.mockImplementationOnce(() => {
      throw new Error("Invariant: static generation store missing in revalidateTag store:abc");
    });
    expect(() => invalidateStore("abc")).not.toThrow();
  });
});

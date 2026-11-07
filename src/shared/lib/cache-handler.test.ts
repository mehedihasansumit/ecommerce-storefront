import { afterEach, describe, expect, it, vi } from "vitest";
import { createCacheHandler, decode, encode, memoryStore } from "../../../cache-handler.mjs";

const fetchCtx = (tags: string[]) => ({ kind: "FETCH", tags, softTags: [] });
const fetchValue = (body: unknown) => ({
  kind: "FETCH",
  data: { headers: {}, body: JSON.stringify(body), status: 200, url: "" },
  revalidate: 300,
});

/** Two handler classes over one store = two app instances sharing Redis. */
function twoInstances() {
  const store = memoryStore();
  const A = createCacheHandler(() => store);
  const B = createCacheHandler(() => store);
  return { a: new A(), b: new B() };
}

afterEach(() => vi.useRealTimers());

describe("shared cache handler", () => {
  it("an entry written by one instance is read by the other", async () => {
    const { a, b } = twoInstances();
    await a.set("k", fetchValue({ name: "Shirt" }), { fetchCache: true, tags: ["store:1"] });

    const hit = await b.get("k", fetchCtx(["store:1"]));
    expect(hit?.value).toEqual(fetchValue({ name: "Shirt" }));
  });

  it("revalidateTag on one instance expires the entry for the other", async () => {
    vi.useFakeTimers({ now: 1_000 });
    const { a, b } = twoInstances();
    await a.set("k", fetchValue({ price: 100 }), { fetchCache: true, tags: ["store:1"] });

    vi.setSystemTime(2_000);
    await a.revalidateTag("store:1", { expire: 0 });

    expect(await b.get("k", fetchCtx(["store:1"]))).toBeNull();
  });

  it("an entry written after the tag expired is a hit", async () => {
    vi.useFakeTimers({ now: 1_000 });
    const { a, b } = twoInstances();
    await a.revalidateTag("store:1", { expire: 0 });

    vi.setSystemTime(2_000);
    await b.set("k", fetchValue({ price: 120 }), { fetchCache: true, tags: ["store:1"] });

    expect(await a.get("k", fetchCtx(["store:1"]))).not.toBeNull();
  });

  it("other stores' tags don't expire the entry", async () => {
    vi.useFakeTimers({ now: 1_000 });
    const { a, b } = twoInstances();
    await a.set("k", fetchValue({}), { fetchCache: true, tags: ["store:1"] });
    vi.setSystemTime(2_000);
    await a.revalidateTag("store:2", { expire: 0 });

    expect(await b.get("k", fetchCtx(["store:1"]))).not.toBeNull();
  });

  it("a stale (not expired) tag returns the entry marked for background refresh", async () => {
    vi.useFakeTimers({ now: 1_000 });
    const { a, b } = twoInstances();
    await a.set("k", fetchValue({}), { fetchCache: true, tags: ["store:1"] });
    vi.setSystemTime(2_000);
    await a.revalidateTag("store:1", { expire: 3600 });

    const hit = await b.get("k", fetchCtx(["store:1"]));
    expect(hit).not.toBeNull();
    expect(hit?.lastModified).toBe(0);
  });

  it("set(null) deletes the entry", async () => {
    const { a, b } = twoInstances();
    await a.set("k", fetchValue({}), { fetchCache: true, tags: [] });
    await a.set("k", null, {});
    expect(await b.get("k", fetchCtx([]))).toBeNull();
  });

  it("fails open: a broken store gives a miss, not an error", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      getEntry: () => Promise.reject(new Error("down")),
      setEntry: () => Promise.reject(new Error("down")),
      deleteEntry: () => Promise.reject(new Error("down")),
      getTagTimes: () => Promise.reject(new Error("down")),
      setTagTimes: () => Promise.reject(new Error("down")),
    };
    const Handler = createCacheHandler(() => broken);
    const h = new Handler();

    await expect(h.get("k", fetchCtx([]))).resolves.toBeNull();
    await expect(h.set("k", fetchValue({}), { fetchCache: true, tags: [] })).resolves.toBeUndefined();
    await expect(h.revalidateTag("store:1")).resolves.toBeUndefined();
    err.mockRestore();
  });

  it("page entries use the tags from their x-next-cache-tags header", async () => {
    vi.useFakeTimers({ now: 1_000 });
    const { a, b } = twoInstances();
    const page = {
      kind: "APP_ROUTE",
      body: Buffer.from("{}"),
      status: 200,
      headers: { "x-next-cache-tags": "_N_T_/api/geo,store:1" },
    };
    await a.set("/api/geo", page, {});
    vi.setSystemTime(2_000);
    await a.revalidateTag("_N_T_/api/geo");

    expect(await b.get("/api/geo", { kind: "APP_ROUTE" })).toBeNull();
  });
});

describe("encode / decode", () => {
  it("round-trips Buffers and Maps inside page entries", () => {
    const value = {
      kind: "APP_PAGE",
      rscData: Buffer.from("rsc payload"),
      segmentData: new Map([["/_index", Buffer.from("seg")]]),
      html: "<html></html>",
    };
    const back = decode(encode(value));
    expect(Buffer.isBuffer(back.rscData)).toBe(true);
    expect(back.rscData.toString()).toBe("rsc payload");
    expect(back.segmentData).toBeInstanceOf(Map);
    expect(back.segmentData.get("/_index").toString()).toBe("seg");
    expect(back.html).toBe("<html></html>");
  });
});

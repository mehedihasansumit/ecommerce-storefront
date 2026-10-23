import { describe, expect, it, vi } from "vitest";

const getFeatured = vi.fn(async () => []);
const getNewArrivals = vi.fn(async () => []);
vi.mock("./service", () => ({
  ProductService: {
    getFeatured: (...a: unknown[]) => getFeatured(...(a as [])),
    getNewArrivals: (...a: unknown[]) => getNewArrivals(...(a as [])),
  },
}));
vi.mock("@/shared/lib/data-cache", () => ({
  cachedForStore: <T>(_name: string, fn: T) => fn,
  storeTag: (id: string) => `store:${id}`,
}));

import { getFeaturedProducts, getNewArrivalProducts } from "./storefront";
import { FEATURED_LIMIT, NEW_ARRIVALS_LIMIT } from "./layout";

describe("home product rows load a bounded number of products", () => {
  it("new arrivals", async () => {
    await getNewArrivalProducts("s1");
    expect(getNewArrivals).toHaveBeenCalledWith("s1", NEW_ARRIVALS_LIMIT);
    expect(NEW_ARRIVALS_LIMIT).toBe(12);
  });

  it("featured", async () => {
    await getFeaturedProducts("s1");
    expect(getFeatured).toHaveBeenCalledWith("s1", FEATURED_LIMIT);
    expect(FEATURED_LIMIT).toBe(24);
  });
});

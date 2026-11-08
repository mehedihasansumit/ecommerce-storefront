import { describe, expect, it } from "vitest";
import {
  MAX_EVENTS_PER_REQUEST,
  buildDomainMap,
  customerIdFor,
  hostnameOf,
  parseEvents,
  readCookie,
} from "../../../tracker/core.mjs";

const STORE = "d0cf7da8-b21e-419a-a971-2ceb5eebcc3e";
const PRODUCT = "58fa9160-e816-4e31-8956-87f3ab69bd5e";
const USER = "d173d407-c9b2-410d-a554-5151e3bbab71";

describe("tracker: store from Host", () => {
  it("matches the store's domains, ignoring case and port", () => {
    const map = buildDomainMap([{ id: STORE, domains: ["www.lourhaus.com", "Lourhaus.com"] }]);
    expect(map.get(hostnameOf("WWW.lourhaus.com:443"))).toBe(STORE);
    expect(map.get(hostnameOf("lourhaus.com"))).toBe(STORE);
    expect(map.get(hostnameOf("evil.example"))).toBeUndefined();
  });
});

describe("tracker: customer from the login cookie", () => {
  it("reads the cookie", () => {
    expect(readCookie("a=1; customer-token=abc.def; b=2", "customer-token")).toBe("abc.def");
    expect(readCookie("a=1", "customer-token")).toBeNull();
  });

  it("only a customer token for this store counts", () => {
    expect(customerIdFor({ type: "customer", storeId: STORE, userId: USER }, STORE)).toBe(USER);
    expect(customerIdFor({ type: "customer", storeId: "other", userId: USER }, STORE)).toBeNull();
    expect(customerIdFor({ type: "admin", adminId: USER }, STORE)).toBeNull();
    expect(customerIdFor(null, STORE)).toBeNull();
  });
});

describe("tracker: events", () => {
  it("accepts a batch, with the store and customer from the request, not the body", () => {
    const rows = parseEvents(
      { events: [{ eventType: "product_view", productId: PRODUCT, productName: "Shirt", storeId: "attacker" }] },
      STORE,
      USER,
    );
    expect(rows).toEqual([
      expect.objectContaining({ storeId: STORE, userId: USER, productId: PRODUCT, productName: "Shirt" }),
    ]);
  });

  it("still accepts a single event object", () => {
    expect(parseEvents({ eventType: "search", searchQuery: "punjabi" }, STORE, null)).toHaveLength(1);
  });

  it("skips invalid events and keeps the rest (one bad id must not fail the batch)", () => {
    const rows = parseEvents(
      {
        events: [
          { eventType: "product_view", productId: "not-a-uuid" },
          { eventType: "product_view" },
          { eventType: "search", searchQuery: "  " },
          { eventType: "hack" },
          { eventType: "add_to_cart", productId: PRODUCT, productName: "x".repeat(301) },
          { eventType: "add_to_cart", productId: PRODUCT, categoryId: PRODUCT },
        ],
      },
      STORE,
      null,
    );
    expect(rows).toHaveLength(1);
    expect(rows?.[0]).toMatchObject({ eventType: "add_to_cart", categoryId: PRODUCT });
  });

  it("refuses an empty, oversized or malformed request", () => {
    expect(parseEvents({ events: [] }, STORE, null)).toBeNull();
    expect(parseEvents({ events: Array.from({ length: MAX_EVENTS_PER_REQUEST + 1 }, () => ({})) }, STORE, null)).toBeNull();
    expect(parseEvents("text", STORE, null)).toBeNull();
    expect(parseEvents(null, STORE, null)).toBeNull();
  });
});

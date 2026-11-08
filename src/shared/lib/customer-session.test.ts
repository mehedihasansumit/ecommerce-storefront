import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let now = 1_000_000;
const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  now = 1_000_000;
  vi.spyOn(Date, "now").mockImplementation(() => now);
  fetchMock.mockReset().mockImplementation(async () => ({ json: async () => ({ user: { email: "a@x.com" } }) }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("fetchCustomerSession", () => {
  it("header and bottom nav asking at once share one request, never browser-cached", async () => {
    const { fetchCustomerSession } = await import("./customer-session");
    const [a, b] = await Promise.all([fetchCustomerSession(), fetchCustomerSession()]);
    expect(a).toEqual({ email: "a@x.com" });
    expect(b).toBe(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/customer", { cache: "no-store" });
  });

  it("asks again after a second, so a login or logout shows on the next page", async () => {
    const { fetchCustomerSession } = await import("./customer-session");
    await fetchCustomerSession();
    now += 1001;
    fetchMock.mockImplementation(async () => ({ json: async () => ({ user: null }) }));
    expect(await fetchCustomerSession()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a failed request isn't reused", async () => {
    const { fetchCustomerSession } = await import("./customer-session");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchCustomerSession()).rejects.toThrow("offline");
    await new Promise((r) => setTimeout(r, 0));
    expect(await fetchCustomerSession()).toEqual({ email: "a@x.com" });
  });
});

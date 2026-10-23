import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "punjabi.localhost:3002" }),
}));
vi.mock("./data-cache", () => ({
  cachedForStore: <T>(_name: string, fn: T) => fn,
  STORE_DOMAINS_TAG: "store-domains",
}));
vi.mock("@/features/stores/repository", () => ({
  StoreRepository: {
    findByDomain: vi.fn(async () => ({
      _id: "s1",
      payment: { provider: "stripe", currency: "BDT", stripeSecretKey: "sk_live_secret", sslcommerzStorePassword: "pw" },
    })),
  },
}));

import { getTenant } from "./tenant";

describe("getTenant", () => {
  it("never returns payment secrets (they would be cached on disk and sent to browsers)", async () => {
    const tenant = await getTenant();
    expect(tenant?._id).toBe("s1");
    expect(tenant?.payment).not.toHaveProperty("stripeSecretKey");
    expect(tenant?.payment).not.toHaveProperty("sslcommerzStorePassword");
  });
});

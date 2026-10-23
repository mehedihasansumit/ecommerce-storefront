import { describe, expect, it } from "vitest";
import { toPublicStore } from "./public-store";
import type { IStore } from "./types";

const store = {
  _id: "s1",
  name: "Punjabi Palace",
  payment: {
    provider: "stripe",
    currency: "BDT",
    stripePublicKey: "pk_live_1",
    stripeSecretKey: "sk_live_secret",
    sslcommerzStoreId: "store1",
    sslcommerzStorePassword: "hunter2",
  },
} as unknown as IStore;

describe("toPublicStore", () => {
  it("drops payment secrets", () => {
    const out = toPublicStore(store);
    expect(out.payment).not.toHaveProperty("stripeSecretKey");
    expect(out.payment).not.toHaveProperty("sslcommerzStorePassword");
  });

  it("keeps the public payment fields and the rest of the store", () => {
    const out = toPublicStore(store);
    expect(out.payment).toMatchObject({ provider: "stripe", currency: "BDT", stripePublicKey: "pk_live_1", sslcommerzStoreId: "store1" });
    expect(out.name).toBe("Punjabi Palace");
  });

  it("does not modify the original store", () => {
    toPublicStore(store);
    expect(store.payment.stripeSecretKey).toBe("sk_live_secret");
  });

  it("handles a store without payment settings", () => {
    expect(toPublicStore({ _id: "s2" } as unknown as IStore)).toEqual({ _id: "s2" });
  });
});

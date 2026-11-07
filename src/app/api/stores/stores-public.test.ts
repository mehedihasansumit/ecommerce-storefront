import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const service = { resolveByDomain: vi.fn(), getById: vi.fn(), getAll: vi.fn() };
const getAdminDbUser = vi.fn();
vi.mock("@/features/stores/service", () => ({ StoreService: service }));
vi.mock("@/shared/lib/auth", () => ({ getAdminDbUser: () => getAdminDbUser() }));

const { GET: resolve } = await import("./resolve/route");
const { GET: byId } = await import("./[storeId]/route");
const { GET: list } = await import("./route");

const store = {
  _id: "s1",
  name: { en: "Lourhaus" },
  domains: ["www.lourhaus.com"],
  payment: {
    provider: "stripe",
    currency: "BDT",
    stripePublicKey: "pk_live_public",
    stripeSecretKey: "sk_live_SECRET",
    sslcommerzStoreId: "lourhaus",
    sslcommerzStorePassword: "SSL_PASSWORD",
  },
};

beforeEach(() => {
  service.resolveByDomain.mockResolvedValue(store);
  service.getById.mockResolvedValue(store);
  service.getAll.mockResolvedValue([store, { ...store, _id: "s2", name: { en: "Other" } }]);
});

async function bodyText(res: Response) {
  return JSON.stringify(await res.json());
}

describe("public store endpoints never return payment secrets", () => {
  it("GET /api/stores/resolve", async () => {
    const res = await resolve(new NextRequest("http://x/api/stores/resolve?domain=www.lourhaus.com"));
    const text = await bodyText(res);
    expect(res.status).toBe(200);
    expect(text).not.toContain("sk_live_SECRET");
    expect(text).not.toContain("SSL_PASSWORD");
    expect(text).toContain("pk_live_public"); // public key is fine for the browser
  });

  it("GET /api/stores/[storeId]", async () => {
    const res = await byId(new NextRequest("http://x/api/stores/s1"), {
      params: Promise.resolve({ storeId: "s1" }),
    });
    const text = await bodyText(res);
    expect(res.status).toBe(200);
    expect(text).not.toContain("sk_live_SECRET");
    expect(text).not.toContain("SSL_PASSWORD");
  });
});

describe("GET /api/stores (admin list)", () => {
  it("shows a store-scoped admin only their stores, without secrets", async () => {
    getAdminDbUser.mockResolvedValue({ assignedStores: ["s1"], role: { isSuperAdmin: false, permissions: [] } });
    const body = await (await list()).json();
    const text = JSON.stringify(body);
    expect(text).toContain('"s1"');
    expect(text).not.toContain('"s2"');
    expect(text).not.toContain("sk_live_SECRET");
    expect(text).not.toContain("SSL_PASSWORD");
  });

  it("a superadmin sees every store, still without secrets", async () => {
    getAdminDbUser.mockResolvedValue({ assignedStores: [], role: { isSuperAdmin: true, permissions: [] } });
    const text = JSON.stringify(await (await list()).json());
    expect(text).toContain('"s2"');
    expect(text).not.toContain("sk_live_SECRET");
  });

  it("401 without an admin", async () => {
    getAdminDbUser.mockResolvedValue(null);
    expect((await list()).status).toBe(401);
  });
});

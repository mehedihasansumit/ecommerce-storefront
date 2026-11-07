import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";
import { maskOrderNumber } from "@/features/orders/tracking";

// A cookie jar standing in for next/headers, so the real signed pass is used.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}));

const STORE = "store-a";
vi.mock("@/shared/lib/tenant", () => ({ getStoreId: async () => STORE }));

const order = {
  _id: "order-1",
  storeId: STORE,
  userId: null as string | null,
  orderNumber: "ORD-AB12CD34",
  status: "pending",
  paymentStatus: "unpaid",
  total: 1500,
  createdAt: new Date("2026-11-01T10:00:00Z"),
  shippingAddress: { name: "Rahim", phone: "+8801711111111", address: "House 1, Dhaka" },
  clientIp: "203.0.113.9",
};
const service = {
  getById: vi.fn(),
  getByOrderNumber: vi.fn(),
  getByOrderNumberAndPhone: vi.fn(),
  getByPhone: vi.fn(),
};
vi.mock("@/features/orders/service", () => ({ OrderService: service }));

const { GET: getOrder } = await import("./[orderId]/route");
const { POST: track } = await import("./track/route");
const { signToken } = await import("@/shared/lib/auth");

const openOrder = () =>
  getOrder(new NextRequest("http://shop.test/api/orders/order-1"), {
    params: Promise.resolve({ orderId: "order-1" }),
  });
const trackWith = (body: object) =>
  track(new NextRequest("http://shop.test/api/orders/track", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  jar.clear();
  vi.clearAllMocks();
  order.userId = null;
  service.getById.mockResolvedValue(order);
  service.getByOrderNumber.mockResolvedValue(order);
  service.getByOrderNumberAndPhone.mockResolvedValue(order);
  service.getByPhone.mockResolvedValue([order]);
});

describe("GET /api/orders/[id]: only the owner or a pass holder", () => {
  it("a stranger with just the order id gets 404 and no personal data", async () => {
    const res = await openOrder();
    expect(res.status).toBe(404);
    expect(JSON.stringify(await res.json())).not.toContain("Rahim");
  });

  it("the logged-in customer who placed it can open it", async () => {
    order.userId = "user-1";
    jar.set("customer-token", await signToken({ type: "customer", userId: "user-1", storeId: STORE } as never));
    expect((await openOrder()).status).toBe(200);
  });

  it("another logged-in customer cannot", async () => {
    order.userId = "user-1";
    jar.set("customer-token", await signToken({ type: "customer", userId: "user-2", storeId: STORE } as never));
    expect((await openOrder()).status).toBe(404);
  });

  it("a forged or edited pass is rejected", async () => {
    const forged = await new SignJWT({ storeId: STORE, orderIds: ["order-1"] })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("order-access")
      .sign(new TextEncoder().encode("not-the-real-secret"));
    jar.set("order-access", forged);
    expect((await openOrder()).status).toBe(404);
  });

  it("a login token can't be used as a pass", async () => {
    jar.set("order-access", await signToken({ type: "customer", userId: "u", storeId: STORE } as never));
    expect((await openOrder()).status).toBe(404);
  });

  it("never returns the shopper's IP address", async () => {
    // get a pass the legitimate way
    await trackWith({ orderNumber: "ORD-AB12CD34", phone: "+8801711111111" });
    const body = await (await openOrder()).json();
    expect(body.order.shippingAddress.name).toBe("Rahim");
    expect(body.order.clientIp).toBeUndefined();
  });
});

describe("POST /api/orders/track", () => {
  it("phone only: masked order number, no order id, no pass", async () => {
    const body = await (await trackWith({ phone: "+8801711111111" })).json();
    expect(body.orders[0]).toMatchObject({ orderId: null, masked: true, orderNumber: "ORD-••••••34" });
    expect(jar.has("order-access")).toBe(false);
    expect((await openOrder()).status).toBe(404);
  });

  it("order number only: summary, no order id, no pass", async () => {
    const body = await (await trackWith({ orderNumber: "ORD-AB12CD34" })).json();
    expect(body.orders[0]).toMatchObject({ orderId: null, masked: false });
    expect((await openOrder()).status).toBe(404);
  });

  it("order number + phone: order id and a pass that opens the order", async () => {
    const body = await (await trackWith({ orderNumber: "ORD-AB12CD34", phone: "+8801711111111" })).json();
    expect(body.orders[0].orderId).toBe("order-1");
    expect((await openOrder()).status).toBe(200);
  });

  it("wrong order number + phone: 404 and no pass", async () => {
    service.getByOrderNumberAndPhone.mockResolvedValue(null);
    expect((await trackWith({ orderNumber: "ORD-ZZZZZZZZ", phone: "+8801711111111" })).status).toBe(404);
    expect(jar.has("order-access")).toBe(false);
  });
});

describe("maskOrderNumber", () => {
  it("keeps the prefix and the last 2 characters", () => {
    expect(maskOrderNumber("ORD-AB12CD34")).toBe("ORD-••••••34");
    expect(maskOrderNumber("XY")).toBe("••••");
  });
});

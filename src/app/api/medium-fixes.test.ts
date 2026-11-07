import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// #6 broadcast permission, #11 public product data, #12 domain takeover.
const getAdminDbUser = vi.fn();
vi.mock("@/shared/lib/auth", () => ({ getAdminDbUser: () => getAdminDbUser() }));

const notificationService = { broadcastAnnouncement: vi.fn() };
vi.mock("@/features/notifications/service", () => ({ NotificationService: notificationService }));

const productService = { getByStore: vi.fn(), getBySlug: vi.fn(), getById: vi.fn() };
vi.mock("@/features/products/service", () => ({ ProductService: productService }));

const storeRepo = { findUsingDomains: vi.fn(), findById: vi.fn(), update: vi.fn(), create: vi.fn() };
vi.mock("@/features/stores/repository", () => ({ StoreRepository: storeRepo }));
vi.mock("@/shared/lib/data-cache", () => ({ invalidateStore: () => {}, cachedForStore: (_: string, fn: unknown) => fn }));

const { POST: broadcast } = await import("./announcements/[announcementId]/broadcast/route");
const { GET: listProducts } = await import("./products/route");
const { GET: getProduct } = await import("./products/[productId]/route");
const { StoreService, DomainTakenError } = await import("@/features/stores/service");
const { PUT: updateStore } = await import("./stores/[storeId]/route");

const admin = (permissions: string[]) => ({ assignedStores: [], role: { isSuperAdmin: false, permissions } });
const product = { _id: "p1", storeId: "s1", isActive: true, costPrice: 400, price: 1000, name: { en: "Shirt" } };

beforeEach(() => {
  vi.clearAllMocks();
  productService.getByStore.mockResolvedValue({ data: [product], total: 1, page: 1, limit: 20, totalPages: 1 });
  productService.getBySlug.mockResolvedValue(product);
  notificationService.broadcastAnnouncement.mockResolvedValue({ sent: 3 });
});

describe("#6 broadcast needs announcements.send", () => {
  const send = () =>
    broadcast(new NextRequest("http://x", { method: "POST", body: JSON.stringify({ storeId: "s1" }) }), {
      params: Promise.resolve({ announcementId: "a1" }),
    });

  it("'create' alone can't email every subscriber", async () => {
    getAdminDbUser.mockResolvedValue(admin(["announcements.create"]));
    expect((await send()).status).toBe(403);
    expect(notificationService.broadcastAnnouncement).not.toHaveBeenCalled();
  });

  it("'send' can, and a second send is refused with 409", async () => {
    getAdminDbUser.mockResolvedValue(admin(["announcements.send"]));
    expect((await send()).status).toBe(200);
    notificationService.broadcastAnnouncement.mockRejectedValue(new Error("Announcement already sent"));
    expect((await send()).status).toBe(409);
  });
});

describe("#11 public product data", () => {
  it("the public list hides cost price and forces active products, capped at 100", async () => {
    getAdminDbUser.mockResolvedValue(null);
    const res = await listProducts(new NextRequest("http://x/api/products?storeId=s1&status=all&limit=100000"));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain("costPrice");
    expect(productService.getByStore).toHaveBeenCalledWith("s1", expect.objectContaining({ status: "active", limit: 100 }));
  });

  it("a store admin with products.edit still sees cost and can list hidden products", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit"]));
    const res = await listProducts(new NextRequest("http://x/api/products?storeId=s1&status=all"));
    expect(JSON.stringify(await res.json())).toContain("costPrice");
    expect(productService.getByStore).toHaveBeenCalledWith("s1", expect.objectContaining({ status: "all" }));
  });

  it("a single product: no cost for the public, and hidden ones are 404", async () => {
    getAdminDbUser.mockResolvedValue(null);
    const get = () =>
      getProduct(new NextRequest("http://x/api/products/shirt?storeId=s1"), { params: Promise.resolve({ productId: "shirt" }) });
    expect(JSON.stringify(await (await get()).json())).not.toContain("costPrice");
    productService.getBySlug.mockResolvedValue({ ...product, isActive: false });
    expect((await get()).status).toBe(404);
  });
});

describe("#12 a domain can't belong to two stores", () => {
  it("adding another store's domain is refused", async () => {
    storeRepo.findUsingDomains.mockResolvedValue([{ id: "store-b", domains: ["www.shop-b.com"] }]);
    await expect(StoreService.update("store-a", { domains: ["www.shop-a.com", "WWW.Shop-B.com"] })).rejects.toThrow(
      DomainTakenError,
    );
    expect(storeRepo.update).not.toHaveBeenCalled();
    expect(storeRepo.findUsingDomains).toHaveBeenCalledWith(["www.shop-a.com", "www.shop-b.com"], "store-a");
  });

  it("keeping your own domains is fine", async () => {
    storeRepo.findUsingDomains.mockResolvedValue([]);
    storeRepo.findById.mockResolvedValue(null);
    storeRepo.update.mockResolvedValue(null);
    await StoreService.update("store-a", { domains: ["www.shop-a.com"] });
    expect(storeRepo.update).toHaveBeenCalled();
  });

  it("the API answers 409 with the clashing domain (not a hidden 500)", async () => {
    getAdminDbUser.mockResolvedValue(admin(["stores.edit"]));
    storeRepo.findUsingDomains.mockResolvedValue([{ id: "store-b", domains: ["www.shop-b.com"] }]);
    const res = await updateStore(
      new NextRequest("http://x/api/stores/store-a", { method: "PUT", body: JSON.stringify({ domains: ["www.shop-b.com"] }) }),
      { params: Promise.resolve({ storeId: "store-a" }) },
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toContain("www.shop-b.com");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAdminDbUser = vi.fn();
const service = { getById: vi.fn(), update: vi.fn(), delete: vi.fn() };

vi.mock("@/shared/lib/auth", () => ({ getAdminDbUser: () => getAdminDbUser() }));
vi.mock("@/features/products/service", () => ({ ProductService: service }));

const { PUT, DELETE } = await import("./[productId]/route");

const admin = (permissions: string[], assignedStores: string[] = ["store-a"]) => ({
  _id: "admin-1",
  assignedStores,
  role: { isSuperAdmin: false, permissions },
});

const req = (method: string, body?: unknown) =>
  new NextRequest("http://shop.test/api/products/p-1", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const params = { params: Promise.resolve({ productId: "p-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  service.getById.mockResolvedValue({ _id: "p-1", storeId: "store-a" });
  service.update.mockResolvedValue({ _id: "p-1", storeId: "store-a" });
  service.delete.mockResolvedValue(true);
});

describe("product edit/delete check the product's own store", () => {
  it("rejects anonymous edit and delete with 401", async () => {
    getAdminDbUser.mockResolvedValue(null);
    expect((await PUT(req("PUT", { price: 1 }), params)).status).toBe(401);
    expect((await DELETE(req("DELETE"), params)).status).toBe(401);
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("rejects an admin of another store with 403, even without storeId in the body", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit", "products.delete"], ["store-b"]));
    expect((await PUT(req("PUT", { price: 1 }), params)).status).toBe(403);
    expect((await DELETE(req("DELETE"), params)).status).toBe(403);
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("rejects an admin without the permission with 403", async () => {
    getAdminDbUser.mockResolvedValue(admin(["orders.view"]));
    expect((await DELETE(req("DELETE"), params)).status).toBe(403);
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("allows an admin of the product's store", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.delete"]));
    expect((await DELETE(req("DELETE"), params)).status).toBe(200);
    expect(service.delete).toHaveBeenCalledWith("p-1");
  });

  it("404s an unknown product", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.delete"]));
    service.getById.mockResolvedValue(null);
    expect((await DELETE(req("DELETE"), params)).status).toBe(404);
  });
});

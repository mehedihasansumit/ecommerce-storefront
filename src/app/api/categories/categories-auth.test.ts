import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAdminDbUser = vi.fn();
const service = {
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getByStore: vi.fn(),
};

vi.mock("@/shared/lib/auth", () => ({ getAdminDbUser: () => getAdminDbUser() }));
vi.mock("@/features/categories/service", () => ({ CategoryService: service }));

const { POST } = await import("./route");
const { PUT, DELETE } = await import("./[categoryId]/route");

const admin = (permissions: string[], assignedStores: string[] = ["store-a"]) => ({
  _id: "admin-1",
  assignedStores,
  role: { isSuperAdmin: false, permissions },
});
const superAdmin = { _id: "root", assignedStores: [], role: { isSuperAdmin: true, permissions: [] } };

const json = (method: string, body: unknown) =>
  new NextRequest("http://shop.test/api/categories", { method, body: JSON.stringify(body) });
const params = { params: Promise.resolve({ categoryId: "cat-1" }) };

beforeEach(() => {
  vi.clearAllMocks();
  service.getById.mockResolvedValue({ _id: "cat-1", storeId: "store-a" });
  service.update.mockResolvedValue({ _id: "cat-1", storeId: "store-a" });
  service.delete.mockResolvedValue(true);
  service.create.mockResolvedValue({ _id: "cat-2" });
});

describe("category write APIs need an admin", () => {
  it("rejects anonymous create, edit and delete with 401 and changes nothing", async () => {
    getAdminDbUser.mockResolvedValue(null);

    expect((await POST(json("POST", { storeId: "store-a", name: { en: "X" } }))).status).toBe(401);
    expect((await PUT(json("PUT", { name: { en: "X" } }), params)).status).toBe(401);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(401);
    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("rejects an admin without the products permission with 403", async () => {
    getAdminDbUser.mockResolvedValue(admin(["orders.view"]));

    expect((await PUT(json("PUT", { name: { en: "X" } }), params)).status).toBe(403);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(403);
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("rejects editing another store's category, judged by the stored category", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit", "products.delete"], ["store-b"]));

    expect((await PUT(json("PUT", { name: { en: "X" } }), params)).status).toBe(403);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(403);
    expect(service.update).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });

  it("rejects creating a category in a store the admin can't access", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.create"], ["store-b"]));

    const res = await POST(json("POST", { storeId: "store-a", name: { en: "X" } }));
    expect(res.status).toBe(403);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("allows a store admin with the permission", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit", "products.delete"]));

    expect((await PUT(json("PUT", { name: { en: "New" } }), params)).status).toBe(200);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(200);
  });

  it("allows a superadmin anywhere", async () => {
    getAdminDbUser.mockResolvedValue(superAdmin);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(200);
  });

  it("404s an unknown category for an authorized admin", async () => {
    getAdminDbUser.mockResolvedValue(superAdmin);
    service.getById.mockResolvedValue(null);
    expect((await DELETE(json("DELETE", {}), params)).status).toBe(404);
  });
});

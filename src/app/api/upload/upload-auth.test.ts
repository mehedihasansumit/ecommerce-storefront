import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getAdminDbUser = vi.fn();
const deleteBlobWithVariants = vi.fn();
vi.mock("@/shared/lib/auth", () => ({ getAdminDbUser: () => getAdminDbUser() }));
vi.mock("@/shared/lib/storage", () => ({
  deleteBlobWithVariants: (key: string) => deleteBlobWithVariants(key),
  uploadFile: vi.fn(),
  generateFileKey: vi.fn(),
  variantKey: vi.fn(),
  publicUrlFor: vi.fn(),
  VARIANT_WIDTHS: [],
  AVIF_VARIANT_WIDTHS: [],
}));

const { DELETE, POST } = await import("./route");

const STORE = "d0cf7da8-b21e-419a-a971-2ceb5eebcc3e";
const admin = (permissions: string[]) => ({
  assignedStores: [],
  role: { isSuperAdmin: false, permissions },
});
const del = (key: string) =>
  DELETE(new NextRequest(`http://x/api/upload?key=${encodeURIComponent(key)}`, { method: "DELETE" }));

beforeEach(() => vi.clearAllMocks());

describe("DELETE /api/upload", () => {
  it("an admin with no permissions can't delete product images", async () => {
    getAdminDbUser.mockResolvedValue(admin([]));
    expect((await del(`${STORE}/products/abc123.webp`)).status).toBe(403);
    expect(deleteBlobWithVariants).not.toHaveBeenCalled();
  });

  it("a product editor can", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit"]));
    expect((await del(`${STORE}/products/abc123.webp`)).status).toBe(200);
    expect(deleteBlobWithVariants).toHaveBeenCalledWith(`${STORE}/products/abc123.webp`);
  });

  it("store images need stores.edit, not products.edit", async () => {
    getAdminDbUser.mockResolvedValue(admin(["products.edit"]));
    expect((await del(`${STORE}/banners/hero.avif`)).status).toBe(403);
  });

  it("only keys shaped like an admin upload are accepted, even for a superadmin", async () => {
    getAdminDbUser.mockResolvedValue({ assignedStores: [], role: { isSuperAdmin: true, permissions: [] } });
    for (const key of [
      `${STORE}/avatars/user-1/a.webp`,
      `${STORE}/reviews/a.webp`,
      `${STORE}/products/../avatars/a.webp`,
      `${STORE}/products/sub/a.webp`,
      `backups/2026-11-07.sql.gz`,
    ]) {
      expect((await del(key)).status).toBe(400);
    }
    expect(deleteBlobWithVariants).not.toHaveBeenCalled();
  });
});

describe("POST /api/upload", () => {
  it("needs the folder's permission", async () => {
    getAdminDbUser.mockResolvedValue(admin(["orders.view"]));
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1])], "a.png", { type: "image/png" }));
    form.set("storeId", STORE);
    form.set("folder", "products");
    const res = await POST(new NextRequest("http://x/api/upload", { method: "POST", body: form }));
    expect(res.status).toBe(403);
  });
});

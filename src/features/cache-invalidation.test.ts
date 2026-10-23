import { beforeEach, describe, expect, it, vi } from "vitest";

// Every service write that changes what the storefront shows must expire that
// store's cached reads. Repositories are faked; the assertion is on invalidateStore.
const invalidateStore = vi.fn();
vi.mock("@/shared/lib/data-cache", () => ({
  invalidateStore: (...args: unknown[]) => invalidateStore(...args),
  cachedForStore: <T>(_name: string, fn: T) => fn,
  storeTag: (id: string) => `store:${id}`,
  STORE_DOMAINS_TAG: "store-domains",
}));
vi.mock("@/shared/lib/storage", () => ({
  deleteUnreferencedBlobs: vi.fn(async () => {}),
  deleteBlobsByPrefix: vi.fn(async () => {}),
}));

const store = { _id: "s1", heroBanners: [], seo: {} };
vi.mock("@/features/stores/repository", () => ({
  StoreRepository: {
    create: vi.fn(async () => store),
    findById: vi.fn(async () => store),
    update: vi.fn(async () => store),
    delete: vi.fn(async () => true),
  },
}));

const category = { _id: "c1", storeId: "s1", image: "" };
vi.mock("@/features/categories/repository", () => ({
  CategoryRepository: {
    create: vi.fn(async () => category),
    findById: vi.fn(async () => category),
    update: vi.fn(async () => category),
    delete: vi.fn(async () => true),
  },
}));

const product = { _id: "p1", storeId: "s1", images: [], variants: [] };
vi.mock("@/features/products/repository", () => ({
  ProductRepository: {
    create: vi.fn(async () => product),
    findById: vi.fn(async () => product),
    findBySlugIncludingInactive: vi.fn(async () => null),
    update: vi.fn(async () => product),
    delete: vi.fn(async () => true),
    updateRatingStats: vi.fn(async () => {}),
    decreaseStock: vi.fn(async () => {}),
    increaseStock: vi.fn(async () => {}),
    decreaseVariantStock: vi.fn(async () => {}),
    increaseVariantStock: vi.fn(async () => {}),
  },
}));

const review = { _id: "r1", storeId: "s1", productId: "p1", userId: "u1", isApproved: true };
vi.mock("@/features/reviews/repository", () => ({
  ReviewRepository: {
    findById: vi.fn(async () => review),
    setApproved: vi.fn(async () => review),
    delete: vi.fn(async () => true),
    getProductRatingStats: vi.fn(async () => ({ averageRating: 5, reviewCount: 1 })),
  },
}));
vi.mock("@/features/points/service", () => ({
  PointService: { awardReviewPoints: vi.fn(async () => {}) },
}));
vi.mock("@/features/orders/repository", () => ({ OrderRepository: {} }));

import { StoreService } from "@/features/stores/service";
import { CategoryService } from "@/features/categories/service";
import { ProductService } from "@/features/products/service";
import { ReviewService } from "@/features/reviews/service";
import { restoreStock, takeStock } from "@/features/orders/stock";

beforeEach(() => invalidateStore.mockClear());

describe("store writes expire the store and domain lookups", () => {
  it("create", async () => {
    await StoreService.create({ name: "New Store", domains: ["new.localhost"] });
    expect(invalidateStore).toHaveBeenCalledWith("s1", { domains: true });
  });
  it("update", async () => {
    await StoreService.update("s1", { name: "Renamed" });
    expect(invalidateStore).toHaveBeenCalledWith("s1", { domains: true });
  });
  it("delete", async () => {
    await StoreService.delete("s1");
    expect(invalidateStore).toHaveBeenCalledWith("s1", { domains: true });
  });
});

describe("category writes expire the store", () => {
  it("create", async () => {
    await CategoryService.create("s1", { name: "Kabli Sets" });
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("update", async () => {
    await CategoryService.update("c1", { sortOrder: 2 });
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("delete", async () => {
    await CategoryService.delete("c1");
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
});

describe("product writes expire the store", () => {
  it("create", async () => {
    await ProductService.create("s1", { name: "Silk Punjabi", sku: "SP-1" } as never);
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("update", async () => {
    await ProductService.update("p1", { stock: 3 });
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("delete", async () => {
    await ProductService.delete("p1");
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
});

describe("review moderation changes ratings and expires the store", () => {
  it("approve", async () => {
    await ReviewService.approve("s1", "r1");
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("reject", async () => {
    await ReviewService.reject("s1", "r1");
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("delete of an approved review", async () => {
    await ReviewService.delete("s1", "r1");
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
});

describe("order stock changes expire the store", () => {
  it("takeStock (order placed)", async () => {
    await takeStock("s1", [{ productId: "p1", quantity: 2 }, { productId: "p1", variantId: "v1", quantity: 1 }]);
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
  it("restoreStock (order cancelled)", async () => {
    await restoreStock("s1", [{ productId: "p1", quantity: 2 }]);
    expect(invalidateStore).toHaveBeenCalledWith("s1");
  });
});

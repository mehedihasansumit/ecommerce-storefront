import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- getCustomerToken: a token only counts on its own store's domain ----
const jar = new Map<string, string>();
let currentStore: string | null = "store-b";
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
  }),
}));
vi.mock("@/shared/lib/tenant", () => ({ getStoreId: async () => currentStore }));

// ---- PointService dependencies ----
const authRepo = { trySpendPoints: vi.fn(), incrementPoints: vi.fn(), findUserInStore: vi.fn() };
const couponRepo = { create: vi.fn() };
const pointRepo = { create: vi.fn() };
vi.mock("@/features/auth/repository", () => ({ AuthRepository: authRepo }));
vi.mock("@/features/coupons/repository", () => ({ CouponRepository: couponRepo }));
vi.mock("./repository", () => ({ PointRepository: pointRepo }));
vi.mock("@/features/stores/service", () => ({
  StoreService: {
    getById: async () => ({
      _id: "store-b",
      pointsConfig: { enabled: true, pointsPerBdt: 10, minRedemptionPoints: 100 },
    }),
  },
}));
vi.mock("@/features/stores/repository", () => ({
  StoreRepository: {
    findById: async () => ({
      _id: "store-b",
      pointsConfig: { enabled: true, pointsPerBdt: 10, minRedemptionPoints: 100 },
    }),
  },
}));

const { getCustomerToken, signToken } = await import("@/shared/lib/auth");
const { PointService } = await import("./service");

beforeEach(() => {
  jar.clear();
  vi.clearAllMocks();
  currentStore = "store-b";
  couponRepo.create.mockResolvedValue({ _id: "coupon-1" });
});

describe("customer token is bound to its store", () => {
  it("a store-A token is ignored on store B", async () => {
    jar.set("customer-token", await signToken({ type: "customer", userId: "u1", storeId: "store-a" } as never));
    expect(await getCustomerToken()).toBeNull();
  });

  it("the same token works on store A", async () => {
    currentStore = "store-a";
    jar.set("customer-token", await signToken({ type: "customer", userId: "u1", storeId: "store-a" } as never));
    expect(await getCustomerToken()).toMatchObject({ userId: "u1", storeId: "store-a" });
  });
});

describe("PointService.redeem", () => {
  it("refuses, and makes no coupon, when this store's balance is too low", async () => {
    authRepo.trySpendPoints.mockResolvedValue(false);
    await expect(PointService.redeem("store-b", "u1", 100)).rejects.toThrow("Insufficient");
    expect(authRepo.trySpendPoints).toHaveBeenCalledWith("store-b", "u1", 100);
    expect(couponRepo.create).not.toHaveBeenCalled();
  });

  it("spends the points before making the coupon", async () => {
    const order: string[] = [];
    authRepo.trySpendPoints.mockImplementation(async () => (order.push("spend"), true));
    couponRepo.create.mockImplementation(async () => (order.push("coupon"), { _id: "c1" }));
    await PointService.redeem("store-b", "u1", 100);
    expect(order).toEqual(["spend", "coupon"]);
    expect(authRepo.incrementPoints).not.toHaveBeenCalled();
  });

  it("gives the points back if the coupon can't be made", async () => {
    authRepo.trySpendPoints.mockResolvedValue(true);
    couponRepo.create.mockRejectedValue(new Error("db down"));
    await expect(PointService.redeem("store-b", "u1", 100)).rejects.toThrow("db down");
    expect(authRepo.incrementPoints).toHaveBeenCalledWith("u1", "store-b", 100);
  });

  it("reads the balance from this store only", async () => {
    authRepo.findUserInStore.mockResolvedValue(null); // the user isn't in store B
    const balance = await PointService.getBalance("store-b", "u1");
    expect(authRepo.findUserInStore).toHaveBeenCalledWith("store-b", "u1");
    expect(balance.points).toBe(0);
  });
});

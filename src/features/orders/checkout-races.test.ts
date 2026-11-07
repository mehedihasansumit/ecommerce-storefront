import { beforeEach, describe, expect, it, vi } from "vitest";

// Covers #7 (coupon race), #8 (stock race), #9 (guest coupon limit), #10 (hidden products).
const productRepo = {
  findById: vi.fn(),
  tryTakeStock: vi.fn(),
  tryTakeVariantStock: vi.fn(),
  increaseStock: vi.fn(),
  increaseVariantStock: vi.fn(),
};
const orderRepo = { create: vi.fn() };
const couponService = { validate: vi.fn(), reserve: vi.fn(), release: vi.fn(), apply: vi.fn() };
const campaignService = {
  evaluateCart: vi.fn(),
  reserveUsageSlots: vi.fn(),
  releaseUsageSlots: vi.fn(),
  recordRedemption: vi.fn(),
};
vi.mock("@/features/products/repository", () => ({ ProductRepository: productRepo }));
vi.mock("./repository", () => ({ OrderRepository: orderRepo }));
vi.mock("@/features/coupons/service", () => ({ CouponService: couponService }));
vi.mock("@/features/campaigns/service", () => ({ CampaignService: campaignService }));
vi.mock("@/features/stores/service", () => ({ StoreService: { getById: async () => ({ _id: "s1" }) } }));
vi.mock("@/features/notifications/service", () => ({ NotificationService: { notify: async () => {} } }));
vi.mock("@/shared/lib/data-cache", () => ({ invalidateStore: () => {} }));

const { OrderService } = await import("./service");

const shirt = {
  _id: "p1",
  storeId: "s1",
  isActive: true,
  name: { en: "Shirt" },
  slug: "shirt",
  price: 1000,
  stock: 5,
  variants: [],
  pricingTiers: [],
};
const input = (extra: object = {}) =>
  ({
    items: [{ productId: "p1", quantity: 1, variantSelections: {} }],
    shippingAddress: { name: "A", phone: "+8801711111111", street: "x", city: "Dhaka", district: "Dhaka" },
    paymentMethod: "cod",
    ...extra,
  }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  productRepo.findById.mockResolvedValue(shirt);
  productRepo.tryTakeStock.mockResolvedValue(true);
  orderRepo.create.mockImplementation(async (o: object) => ({ _id: "o1", ...o }));
  couponService.validate.mockResolvedValue({ valid: true, discount: 100, couponId: "c1" });
  couponService.reserve.mockResolvedValue(true);
  campaignService.evaluateCart.mockResolvedValue({ appliedCampaigns: [], discountTotal: 0, freeShipping: false });
  campaignService.reserveUsageSlots.mockResolvedValue({ reserved: [], failed: [] });
});

describe("checkout reserves stock and coupon before saving the order", () => {
  it("#8 out of stock at the last moment: no order is saved", async () => {
    productRepo.tryTakeStock.mockResolvedValue(false); // another order took the last one
    await expect(OrderService.create("s1", input())).rejects.toThrow("Insufficient stock");
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it("#7 coupon used up at the last moment: no order, stock untouched", async () => {
    couponService.reserve.mockResolvedValue(false);
    await expect(OrderService.create("s1", input({ couponCode: "ONCE" }))).rejects.toThrow("usage limit");
    expect(productRepo.tryTakeStock).not.toHaveBeenCalled();
    expect(orderRepo.create).not.toHaveBeenCalled();
  });

  it("#7/#8 stock short after the coupon was reserved: the coupon use is given back", async () => {
    productRepo.tryTakeStock.mockResolvedValue(false);
    await expect(OrderService.create("s1", input({ couponCode: "ONCE" }))).rejects.toThrow("Insufficient stock");
    expect(couponService.release).toHaveBeenCalledWith("c1");
  });

  it("saving the order fails: stock and coupon are both given back", async () => {
    orderRepo.create.mockRejectedValue(new Error("db down"));
    await expect(OrderService.create("s1", input({ couponCode: "ONCE" }))).rejects.toThrow("db down");
    expect(couponService.release).toHaveBeenCalledWith("c1");
    expect(productRepo.increaseStock).toHaveBeenCalledWith("p1", 1);
  });

  it("#9 a guest's coupon check gets their phone (per-customer limit by phone)", async () => {
    await OrderService.create("s1", input({ couponCode: "WELCOME" }));
    expect(couponService.validate).toHaveBeenCalledWith(
      "s1", "WELCOME", expect.anything(), undefined, "+8801711111111",
    );
    expect(campaignService.evaluateCart).toHaveBeenCalledWith(
      "s1", undefined, expect.anything(), { phone: "+8801711111111" },
    );
  });

  it("#10 a hidden product can't be ordered", async () => {
    productRepo.findById.mockResolvedValue({ ...shirt, isActive: false });
    await expect(OrderService.create("s1", input())).rejects.toThrow("Product not found");
  });
});

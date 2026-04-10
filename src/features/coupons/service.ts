import { CouponRepository } from "./repository";
import type { ICoupon, CouponValidationResult } from "./types";
import type { CreateCouponInput, UpdateCouponInput } from "./schemas";

interface CartItemForValidation {
  productId: string;
  quantity: number;
  price: number;
  categoryId?: string;
}

export const CouponService = {
  async create(storeId: string, input: CreateCouponInput): Promise<ICoupon> {
    if (input.validUntil <= input.validFrom) {
      throw new Error("Valid until must be after valid from");
    }
    if (input.type === "percentage" && input.value > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    const existing = await CouponRepository.findByCode(storeId, input.code);
    if (existing) {
      throw new Error("Coupon code already exists for this store");
    }

    return CouponRepository.create({ ...input, storeId });
  },

  async update(
    storeId: string,
    couponId: string,
    input: UpdateCouponInput
  ): Promise<ICoupon | null> {
    const coupon = await CouponRepository.findById(couponId);
    if (!coupon || coupon.storeId !== storeId) return null;

    if (input.type === "percentage" && input.value && input.value > 100) {
      throw new Error("Percentage discount cannot exceed 100%");
    }

    if (input.code && input.code !== coupon.code) {
      const existing = await CouponRepository.findByCode(storeId, input.code);
      if (existing) throw new Error("Coupon code already exists for this store");
    }

    return CouponRepository.update(couponId, input);
  },

  async delete(storeId: string, couponId: string): Promise<boolean> {
    const coupon = await CouponRepository.findById(couponId);
    if (!coupon || coupon.storeId !== storeId) return false;
    return CouponRepository.delete(couponId);
  },

  async getById(storeId: string, couponId: string): Promise<ICoupon | null> {
    const coupon = await CouponRepository.findById(couponId);
    if (!coupon || coupon.storeId !== storeId) return null;
    return coupon;
  },

  async listByStore(
    storeId: string,
    options?: { page?: number; limit?: number; isActive?: boolean }
  ): Promise<{ coupons: ICoupon[]; total: number }> {
    return CouponRepository.findByStore(storeId, options);
  },

  async validate(
    storeId: string,
    code: string,
    items: CartItemForValidation[],
    userId?: string
  ): Promise<CouponValidationResult> {
    const coupon = await CouponRepository.findByCode(storeId, code);
    if (!coupon) {
      return { valid: false, discount: 0, reason: "Coupon not found" };
    }

    if (!coupon.isActive) {
      return { valid: false, discount: 0, reason: "Coupon is inactive" };
    }

    if (coupon.requiresLogin && !userId) {
      return { valid: false, discount: 0, reason: "You must be logged in to use this coupon" };
    }

    const now = new Date();
    if (now < new Date(coupon.validFrom)) {
      return { valid: false, discount: 0, reason: "Coupon is not yet valid" };
    }
    if (now > new Date(coupon.validUntil)) {
      return { valid: false, discount: 0, reason: "Coupon has expired" };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, reason: "Coupon usage limit reached" };
    }

    if (userId) {
      const userUsageCount = await CouponRepository.countUserUsage(
        coupon._id,
        userId
      );
      if (userUsageCount >= coupon.perCustomerLimit) {
        return {
          valid: false,
          discount: 0,
          reason: "You have already used this coupon the maximum number of times",
        };
      }
    }

    // Filter applicable items
    let applicableItems = items;
    if (coupon.applicableProducts.length > 0) {
      applicableItems = items.filter((item) =>
        coupon.applicableProducts.includes(item.productId)
      );
    }
    if (coupon.applicableCategories.length > 0) {
      applicableItems = applicableItems.filter(
        (item) =>
          item.categoryId &&
          coupon.applicableCategories.includes(item.categoryId)
      );
    }

    if (applicableItems.length === 0) {
      return {
        valid: false,
        discount: 0,
        reason: "Coupon is not applicable to any items in your cart",
      };
    }

    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (totalSubtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        reason: `Minimum order amount of ${coupon.minOrderAmount} not met`,
      };
    }

    let discount: number;
    if (coupon.type === "percentage") {
      discount = (applicableSubtotal * coupon.value) / 100;
      if (coupon.maxDiscountAmount !== null) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(coupon.value, applicableSubtotal);
    }

    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      discount,
      couponId: coupon._id,
    };
  },

  async apply(couponId: string, userId: string, orderId: string, storeId: string): Promise<void> {
    await CouponRepository.incrementUsage(couponId);
    if (userId) {
      await CouponRepository.createUsage({ couponId, userId, orderId, storeId });
    }
  },
};

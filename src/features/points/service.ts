import { PointRepository } from "./repository";
import { AuthRepository } from "@/features/auth/repository";
import { CouponRepository } from "@/features/coupons/repository";
import type { IPointTransaction } from "./types";
import type { ICoupon } from "@/features/coupons/types";
import {
  POINTS_PER_REVIEW,
  MIN_REDEMPTION_POINTS,
  POINTS_PER_BDT,
} from "./types";

export const PointService = {
  async awardReviewPoints(
    storeId: string,
    userId: string,
    reviewId: string
  ): Promise<void> {
    // Idempotency guard: only award once per review
    const alreadyAwarded = await PointRepository.existsForReview(reviewId);
    if (alreadyAwarded) return;

    await PointRepository.create({
      storeId,
      userId,
      amount: POINTS_PER_REVIEW,
      reason: "review_approved",
      reviewId,
    } as Partial<IPointTransaction>);

    await AuthRepository.incrementPoints(userId, storeId, POINTS_PER_REVIEW);
  },

  async redeem(
    storeId: string,
    userId: string,
    pointsToRedeem: number
  ): Promise<{ coupon: ICoupon; pointsRedeemed: number; discountValue: number }> {
    if (pointsToRedeem < MIN_REDEMPTION_POINTS) {
      throw new Error(`Minimum redemption is ${MIN_REDEMPTION_POINTS} points`);
    }
    if (pointsToRedeem % MIN_REDEMPTION_POINTS !== 0) {
      throw new Error(`Must redeem in multiples of ${MIN_REDEMPTION_POINTS} points`);
    }

    const balance = await PointService.getBalance(storeId, userId);
    if (balance.points < pointsToRedeem) {
      throw new Error("Insufficient points balance");
    }

    const discountValue = pointsToRedeem / POINTS_PER_BDT;

    // Generate unique coupon code
    const suffix = userId.slice(-6).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `POINTS-${suffix}-${timestamp}`;

    const now = new Date();
    const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    const coupon = await CouponRepository.create({
      storeId,
      code,
      description: `Points redemption: ${pointsToRedeem} pts = ৳${discountValue}`,
      type: "fixed",
      value: discountValue,
      minOrderAmount: 0,
      maxDiscountAmount: null,
      validFrom: now,
      validUntil,
      usageLimit: 1,
      usedCount: 0,
      perCustomerLimit: 1,
      requiresLogin: true,
      isActive: true,
      applicableProducts: [],
      applicableCategories: [],
    });

    await PointRepository.create({
      storeId,
      userId,
      amount: -pointsToRedeem,
      reason: "redemption",
      couponId: coupon._id,
    } as Partial<IPointTransaction>);

    await AuthRepository.incrementPoints(userId, storeId, -pointsToRedeem);

    return { coupon, pointsRedeemed: pointsToRedeem, discountValue };
  },

  async getBalance(
    storeId: string,
    userId: string
  ): Promise<{ points: number; equivalentBDT: number; pointsNeeded: number }> {
    const user = await AuthRepository.findUserById(userId);
    const points = user?.points ?? 0;
    const equivalentBDT = Math.floor(points / POINTS_PER_BDT);
    const pointsNeeded = points < MIN_REDEMPTION_POINTS ? MIN_REDEMPTION_POINTS - points : 0;
    return { points, equivalentBDT, pointsNeeded };
  },

  async getHistory(
    storeId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ transactions: IPointTransaction[]; total: number; totalPages: number }> {
    const { transactions, total } = await PointRepository.findByUser(storeId, userId, { page, limit });
    return { transactions, total, totalPages: Math.ceil(total / limit) };
  },
};

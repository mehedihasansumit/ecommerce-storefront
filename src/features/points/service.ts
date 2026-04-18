import { PointRepository } from "./repository";
import { AuthRepository } from "@/features/auth/repository";
import { CouponRepository } from "@/features/coupons/repository";
import { StoreRepository } from "@/features/stores/repository";
import type { IPointTransaction } from "./types";
import type { ICoupon } from "@/features/coupons/types";
import type { IUser } from "@/features/auth/types";
import type { IStorePointsConfig } from "@/features/stores/types";
import {
  POINTS_PER_REVIEW,
  MIN_REDEMPTION_POINTS,
  POINTS_PER_BDT,
} from "./types";

const DEFAULT_CONFIG: IStorePointsConfig = {
  enabled: true,
  pointsPerReview: POINTS_PER_REVIEW,
  minRedemptionPoints: MIN_REDEMPTION_POINTS,
  pointsPerBdt: POINTS_PER_BDT,
};

async function resolveConfig(storeId: string): Promise<IStorePointsConfig> {
  const store = await StoreRepository.findById(storeId);
  const raw = store?.pointsConfig;
  return {
    enabled: raw?.enabled ?? DEFAULT_CONFIG.enabled,
    pointsPerReview: raw?.pointsPerReview ?? DEFAULT_CONFIG.pointsPerReview,
    minRedemptionPoints:
      raw?.minRedemptionPoints ?? DEFAULT_CONFIG.minRedemptionPoints,
    pointsPerBdt: raw?.pointsPerBdt ?? DEFAULT_CONFIG.pointsPerBdt,
  };
}

export const PointService = {
  async getConfig(storeId: string): Promise<IStorePointsConfig> {
    return resolveConfig(storeId);
  },

  async awardReviewPoints(
    storeId: string,
    userId: string,
    reviewId: string
  ): Promise<void> {
    const config = await resolveConfig(storeId);
    if (!config.enabled || config.pointsPerReview <= 0) return;

    // Idempotency guard: only award once per review
    const alreadyAwarded = await PointRepository.existsForReview(reviewId);
    if (alreadyAwarded) return;

    await PointRepository.create({
      storeId,
      userId,
      amount: config.pointsPerReview,
      reason: "review_approved",
      reviewId,
    } as Partial<IPointTransaction>);

    await AuthRepository.incrementPoints(userId, storeId, config.pointsPerReview);
  },

  async redeem(
    storeId: string,
    userId: string,
    pointsToRedeem: number
  ): Promise<{ coupon: ICoupon; pointsRedeemed: number; discountValue: number }> {
    const config = await resolveConfig(storeId);
    if (!config.enabled) {
      throw new Error("Points redemption is disabled for this store");
    }
    if (pointsToRedeem < config.minRedemptionPoints) {
      throw new Error(`Minimum redemption is ${config.minRedemptionPoints} points`);
    }
    if (pointsToRedeem % config.minRedemptionPoints !== 0) {
      throw new Error(
        `Must redeem in multiples of ${config.minRedemptionPoints} points`
      );
    }

    const balance = await PointService.getBalance(storeId, userId);
    if (balance.points < pointsToRedeem) {
      throw new Error("Insufficient points balance");
    }

    const discountValue = pointsToRedeem / config.pointsPerBdt;

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
    const config = await resolveConfig(storeId);
    const user = await AuthRepository.findUserById(userId);
    const points = user?.points ?? 0;
    const equivalentBDT = Math.floor(points / config.pointsPerBdt);
    const pointsNeeded =
      points < config.minRedemptionPoints ? config.minRedemptionPoints - points : 0;
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

  async getStoreLedger(
    storeId: string,
    page: number,
    limit: number
  ): Promise<{
    transactions: IPointTransaction[];
    users: Record<string, { name: string; email: string }>;
    total: number;
    totalPages: number;
  }> {
    const { transactions, total } = await PointRepository.findByStore(storeId, {
      page,
      limit,
    });
    const userIds = Array.from(new Set(transactions.map((t) => t.userId)));
    const users = await AuthRepository.findUsersByIds(userIds);
    const userMap: Record<string, { name: string; email: string }> = {};
    for (const u of users) {
      userMap[u._id] = { name: u.name, email: u.email };
    }
    return {
      transactions,
      users: userMap,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getStoreStats(storeId: string): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    outstanding: number;
    activeHolders: number;
    transactionCount: number;
  }> {
    const [ledgerStats, activeHolders] = await Promise.all([
      PointRepository.getStoreStats(storeId),
      AuthRepository.countCustomersByPoints(storeId, { minPoints: 1 }),
    ]);
    return {
      totalEarned: ledgerStats.totalEarned,
      totalRedeemed: ledgerStats.totalRedeemed,
      outstanding: ledgerStats.totalEarned - ledgerStats.totalRedeemed,
      activeHolders,
      transactionCount: ledgerStats.transactionCount,
    };
  },

  async getTopCustomers(
    storeId: string,
    { page = 1, limit = 20, search }: { page?: number; limit?: number; search?: string } = {}
  ): Promise<{ customers: Omit<IUser, "passwordHash">[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      AuthRepository.findCustomersByPoints(storeId, { skip, limit, search }),
      AuthRepository.countCustomersByPoints(storeId, { search }),
    ]);
    const customers = users.map(({ passwordHash: _pw, ...rest }) => rest);
    return {
      customers,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  },

  async getCustomerSummary(
    storeId: string,
    userId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{
    user: Omit<IUser, "passwordHash">;
    balance: { points: number; equivalentBDT: number; pointsNeeded: number };
    ledger: { transactions: IPointTransaction[]; total: number; totalPages: number };
    config: IStorePointsConfig;
  } | null> {
    const user = await AuthRepository.findUserById(userId);
    if (!user || user.storeId !== storeId) return null;
    const [balance, ledger, config] = await Promise.all([
      PointService.getBalance(storeId, userId),
      PointService.getHistory(storeId, userId, page, limit),
      resolveConfig(storeId),
    ]);
    const { passwordHash: _pw, ...safeUser } = user;
    return { user: safeUser, balance, ledger, config };
  },
};

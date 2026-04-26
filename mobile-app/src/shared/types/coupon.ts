export type CouponType = "percentage" | "fixed";

export interface ICoupon {
  _id: string;
  storeId: string;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
  requiresLogin: boolean;
  isActive: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  couponId?: string;
  reason?: string;
}

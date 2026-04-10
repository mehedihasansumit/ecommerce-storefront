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
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number;
  applicableProducts: string[];
  applicableCategories: string[];
  requiresLogin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponDocument {
  _id: import("mongoose").Types.ObjectId;
  storeId: import("mongoose").Types.ObjectId;
  code: string;
  description: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  validFrom: Date;
  validUntil: Date;
  usageLimit: number | null;
  usedCount: number;
  perCustomerLimit: number;
  applicableProducts: import("mongoose").Types.ObjectId[];
  applicableCategories: import("mongoose").Types.ObjectId[];
  requiresLogin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponUsage {
  _id: string;
  couponId: string;
  userId: string;
  orderId: string;
  storeId: string;
  usedAt: Date;
}

export interface CouponValidationResult {
  valid: boolean;
  discount: number;
  couponId?: string;
  reason?: string;
}

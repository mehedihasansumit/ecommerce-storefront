import { apiClient } from "./client";
import type { CouponValidationResult } from "@/shared/types/coupon";

export async function validateCoupon(
  code: string,
  cartTotal: number
): Promise<CouponValidationResult> {
  const { data } = await apiClient.post<CouponValidationResult>("/api/coupons/validate", {
    code,
    cartTotal,
  });
  return data;
}

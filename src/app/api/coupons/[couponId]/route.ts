import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/features/coupons/service";
import { updateCouponSchema } from "@/features/coupons/schemas";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

type Params = { params: Promise<{ couponId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { couponId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.COUPONS_VIEW))
      return forbiddenResponse("Missing permission");

    const coupon = await CouponService.getById(storeId, couponId);
    if (!coupon) return notFoundResponse("Coupon not found");
    return successResponse(coupon);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { couponId } = await params;
    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.COUPONS_EDIT))
      return forbiddenResponse("Missing permission");

    const validated = updateCouponSchema.parse(rest);
    const coupon = await CouponService.update(storeId, couponId, validated);
    if (!coupon) return notFoundResponse("Coupon not found");
    return successResponse(coupon);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message || "Validation error", 400);
    }
    if (err instanceof Error) {
      return errorResponse(err.message, 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { couponId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.COUPONS_DELETE))
      return forbiddenResponse("Missing permission");

    const deleted = await CouponService.delete(storeId, couponId);
    if (!deleted) return notFoundResponse("Coupon not found");
    return successResponse({ message: "Coupon deleted" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

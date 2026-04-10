import { NextRequest, NextResponse } from "next/server";
import { CouponService } from "@/features/coupons/service";
import { createCouponSchema } from "@/features/coupons/schemas";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.COUPONS_VIEW))
      return forbiddenResponse("Missing permission");

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const result = await CouponService.listByStore(storeId, { page, limit });
    return successResponse(result);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.COUPONS_CREATE))
      return forbiddenResponse("Missing permission");

    const validated = createCouponSchema.parse(rest);
    const coupon = await CouponService.create(storeId, validated);
    return NextResponse.json(coupon, { status: 201 });
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

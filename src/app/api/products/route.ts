import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/service";
import { createProductSchema } from "@/features/products/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    const result = await ProductService.getByStore(storeId, { page, limit });
    return successResponse(result);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.PRODUCTS_CREATE)) return forbiddenResponse("Missing permission: products.create");

    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");

    const validated = createProductSchema.parse(rest);
    const product = await ProductService.create(storeId, validated as Parameters<typeof ProductService.create>[1]);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) return errorResponse(err.issues[0].message, 400);
    return errorResponse("Internal server error", 500);
  }
}

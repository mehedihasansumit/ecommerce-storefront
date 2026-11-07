import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/features/categories/service";
import { createCategorySchema } from "@/features/categories/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);

    const categories = await CategoryService.getByStore(storeId);
    return successResponse(categories);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

// Categories are part of the catalog, so they use the products.* permissions.
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.PRODUCTS_CREATE)) return forbiddenResponse("Missing permission: products.create");

    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");

    const validated = createCategorySchema.parse(rest);
    const category = await CategoryService.create(storeId, validated as Parameters<typeof CategoryService.create>[1]);
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation error", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/service";
import { withoutCost } from "@/features/products/public-product";
import { createProductSchema } from "@/features/products/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

/** Most products one request may list (also the public page size cap). */
const MAX_LIMIT = 100;

/**
 * Product list. Public callers get active products only, without the cost
 * price. An admin of the store may also list hidden products (`status`), and
 * sees the cost price with a products permission.
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);

    const admin = await getAdminDbUser();
    const isStoreAdmin = !!admin && canAccessStore(admin, storeId);
    const seesCost =
      isStoreAdmin &&
      (hasPermission(admin, PERMISSIONS.PRODUCTS_EDIT) || hasPermission(admin, PERMISSIONS.PRODUCTS_CREATE));

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") || "20") || 20),
    );
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const categoryId = request.nextUrl.searchParams.get("categoryId") || undefined;
    const statusParam = request.nextUrl.searchParams.get("status");
    const status = !isStoreAdmin
      ? "active"
      : statusParam === "active" || statusParam === "inactive" || statusParam === "all"
        ? statusParam
        : undefined;

    const result = await ProductService.getByStore(storeId, {
      page,
      limit,
      search,
      categoryId,
      status,
    });
    if (seesCost) return successResponse(result);
    return successResponse({ ...result, data: result.data.map(withoutCost) });
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
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("Duplicate SKU. Each variant must have a unique SKU.", 409);
    }
    return errorResponse("Internal server error", 500);
  }
}

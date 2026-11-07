import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/service";
import { withoutCost } from "@/features/products/public-product";
import { updateProductSchema } from "@/features/products/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS, type Permission } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const isObjectId = /^[a-f\d]{24}$/i.test(productId);

    let product;
    if (isObjectId) {
      product = await ProductService.getById(productId);
    } else {
      const storeId = request.nextUrl.searchParams.get("storeId");
      if (!storeId) return errorResponse("storeId is required", 400);
      product = await ProductService.getBySlug(storeId, productId);
    }

    if (!product) return errorResponse("Product not found", 404);

    // Shoppers see active products only, without the cost price; an admin of the
    // store with a products permission sees everything.
    const admin = await getAdminDbUser();
    const isStoreAdmin = !!admin && canAccessStore(admin, product.storeId);
    if (!isStoreAdmin && !product.isActive) return errorResponse("Product not found", 404);
    const seesCost =
      isStoreAdmin &&
      (hasPermission(admin, PERMISSIONS.PRODUCTS_EDIT) || hasPermission(admin, PERMISSIONS.PRODUCTS_CREATE));
    return successResponse(seesCost ? product : withoutCost(product));
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Admin with `permission` and access to the product's own store. The store
 * comes from the stored product, not the request, so an admin of one store
 * can't edit another store's product by its id.
 */
async function authorize(productId: string, permission: Permission) {
  const admin = await getAdminDbUser();
  if (!admin) return { denied: unauthorizedResponse() };
  if (!hasPermission(admin, permission)) {
    return { denied: forbiddenResponse(`Missing permission: ${permission}`) };
  }
  const product = await ProductService.getById(productId);
  if (!product) return { denied: errorResponse("Product not found", 404) };
  if (!canAccessStore(admin, product.storeId)) {
    return { denied: forbiddenResponse("No access to this store") };
  }
  return { denied: null };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { denied } = await authorize(productId, PERMISSIONS.PRODUCTS_EDIT);
    if (denied) return denied;

    const body = await request.json();
    const validated = updateProductSchema.parse(body);
    const product = await ProductService.update(productId, validated);
    if (!product) return errorResponse("Product not found", 404);
    return successResponse(product);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Invalid input data", 400);
    }
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      return errorResponse("Duplicate SKU. Each variant must have a unique SKU.", 409);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const { denied } = await authorize(productId, PERMISSIONS.PRODUCTS_DELETE);
    if (denied) return denied;

    const deleted = await ProductService.delete(productId);
    if (!deleted) return errorResponse("Product not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/features/categories/service";
import { updateCategorySchema } from "@/features/categories/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS, type Permission } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const category = await CategoryService.getById(categoryId);
    if (!category) return errorResponse("Category not found", 404);
    return successResponse(category);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Admin with `permission` and access to the category's own store. The store
 * comes from the stored category, not the request, so an admin of one store
 * can't edit another store's category by its id.
 */
async function authorize(categoryId: string, permission: Permission) {
  const admin = await getAdminDbUser();
  if (!admin) return { denied: unauthorizedResponse() };
  if (!hasPermission(admin, permission)) {
    return { denied: forbiddenResponse(`Missing permission: ${permission}`) };
  }
  const category = await CategoryService.getById(categoryId);
  if (!category) return { denied: errorResponse("Category not found", 404) };
  if (!canAccessStore(admin, category.storeId)) {
    return { denied: forbiddenResponse("No access to this store") };
  }
  return { denied: null };
}

// Categories are part of the catalog, so they use the products.* permissions.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const { denied } = await authorize(categoryId, PERMISSIONS.PRODUCTS_EDIT);
    if (denied) return denied;

    const body = await request.json();
    const validated = updateCategorySchema.parse(body);
    const category = await CategoryService.update(categoryId, validated);
    if (!category) return errorResponse("Category not found", 404);
    return successResponse(category);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Validation error", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const { denied } = await authorize(categoryId, PERMISSIONS.PRODUCTS_DELETE);
    if (denied) return denied;

    const deleted = await CategoryService.delete(categoryId);
    if (!deleted) return errorResponse("Category not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

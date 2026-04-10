import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/service";
import { updateProductSchema } from "@/features/products/schemas";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const product = await ProductService.getById(productId);
    if (!product) return errorResponse("Product not found", 404);
    return successResponse(product);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const admin = (await getAdminToken()) as JwtAdminPayload | null;
    if (!admin || admin.type !== "admin") return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.PRODUCTS_EDIT)) return forbiddenResponse("Missing permission: products.edit");

    const { productId } = await params;
    const body = await request.json();

    // Check store access if storeId provided in body
    if (body.storeId && !canAccessStore(admin, body.storeId)) {
      return forbiddenResponse("No access to this store");
    }

    const validated = updateProductSchema.parse(body);
    const product = await ProductService.update(productId, validated);
    if (!product) return errorResponse("Product not found", 404);
    return successResponse(product);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message ?? "Invalid input data", 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const admin = (await getAdminToken()) as JwtAdminPayload | null;
    if (!admin || admin.type !== "admin") return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.PRODUCTS_DELETE)) return forbiddenResponse("Missing permission: products.delete");

    const { productId } = await params;
    const deleted = await ProductService.delete(productId);
    if (!deleted) return errorResponse("Product not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

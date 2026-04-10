import { NextRequest } from "next/server";
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { StoreService } from "@/features/stores/service";
import { updateStoreSchema } from "@/features/stores/schemas";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const store = await StoreService.getById(storeId);
    if (!store) return notFoundResponse("Store not found");
    return successResponse(store);
  } catch {
    return errorResponse("Failed to fetch store", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.STORES_EDIT)) return forbiddenResponse("Missing permission: stores.edit");

    const { storeId } = await params;
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");

    const body = await request.json();
    const validated = updateStoreSchema.parse(body);
    // Strip undefined values — MongoDB does not accept undefined in $set
    const cleanData = JSON.parse(JSON.stringify(validated));
    const store = await StoreService.update(storeId, cleanData);
    if (!store) return notFoundResponse("Store not found");
    return successResponse(store);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message || "Validation failed", 422);
    }
    console.error("[PUT /api/stores] error:", error);
    return errorResponse("Failed to update store", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.STORES_DELETE)) return forbiddenResponse("Missing permission: stores.delete");

    const { storeId } = await params;
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    const deleted = await StoreService.delete(storeId);
    if (!deleted) return notFoundResponse("Store not found");
    return successResponse({ message: "Store deleted" });
  } catch {
    return errorResponse("Failed to delete store", 500);
  }
}

import { NextRequest } from "next/server";
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } from "@/shared/lib/api-response";
import { StoreService } from "@/features/stores/service";
import { updateStoreSchema } from "@/features/stores/schemas";
import { getAdminToken } from "@/shared/lib/auth";

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
    const admin = await getAdminToken();
    if (!admin || admin.type !== "admin") return unauthorizedResponse();

    const { storeId } = await params;
    const body = await request.json();
    const validated = updateStoreSchema.parse(body);
    const store = await StoreService.update(storeId, validated);
    if (!store) return notFoundResponse("Store not found");
    return successResponse(store);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 422);
    }
    return errorResponse("Failed to update store", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const admin = await getAdminToken();
    if (!admin || admin.type !== "admin") return unauthorizedResponse();

    const { storeId } = await params;
    const deleted = await StoreService.delete(storeId);
    if (!deleted) return notFoundResponse("Store not found");
    return successResponse({ message: "Store deleted" });
  } catch {
    return errorResponse("Failed to delete store", 500);
  }
}

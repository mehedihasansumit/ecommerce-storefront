import { NextRequest } from "next/server";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/shared/lib/api-response";
import { StoreService, DomainTakenError } from "@/features/stores/service";
import { createStoreSchema } from "@/features/stores/schemas";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { toPublicStore } from "@/features/stores/public-store";

export async function GET() {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    // Only the stores this admin may manage, and never their payment secrets
    // (Stripe secret key, SSLCommerz password); nothing that lists stores needs them.
    const stores = await StoreService.getAll();
    return successResponse(
      stores.filter((store) => canAccessStore(admin, store._id)).map(toPublicStore),
    );
  } catch {
    return errorResponse("Failed to fetch stores", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!hasPermission(admin, PERMISSIONS.STORES_CREATE)) return forbiddenResponse("Missing permission: stores.create");

    const body = await request.json();
    const validated = createStoreSchema.parse(body);
    const store = await StoreService.create(validated);
    return successResponse(store, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 422);
    }
    if (error instanceof DomainTakenError) return errorResponse(error.message, 409);
    return errorResponse("Failed to create store", 500);
  }
}

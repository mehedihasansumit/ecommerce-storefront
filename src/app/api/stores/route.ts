import { NextRequest } from "next/server";
import { successResponse, errorResponse, unauthorizedResponse } from "@/shared/lib/api-response";
import { StoreService } from "@/features/stores/service";
import { createStoreSchema } from "@/features/stores/schemas";
import { getAdminToken } from "@/shared/lib/auth";

export async function GET() {
  try {
    const admin = await getAdminToken();
    if (!admin || admin.type !== "admin") {
      return unauthorizedResponse();
    }

    const stores = await StoreService.getAll();
    return successResponse(stores);
  } catch {
    return errorResponse("Failed to fetch stores", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminToken();
    if (!admin || admin.type !== "admin") {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validated = createStoreSchema.parse(body);
    const store = await StoreService.create(validated);
    return successResponse(store, 201);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return errorResponse("Validation failed", 422);
    }
    return errorResponse("Failed to create store", 500);
  }
}

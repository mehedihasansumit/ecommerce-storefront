import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { StoreService } from "@/features/stores/service";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain");

  if (!domain) {
    return errorResponse("Domain parameter is required");
  }

  try {
    const store = await StoreService.resolveByDomain(domain);

    if (!store) {
      return errorResponse("Store not found", 404);
    }

    return successResponse(store);
  } catch {
    return errorResponse("Failed to resolve store", 500);
  }
}

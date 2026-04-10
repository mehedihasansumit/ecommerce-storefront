import { NextRequest } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") return unauthorizedResponse();
    const { userId } = payload as JwtCustomerPayload;

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    const result = await NotificationService.getForUser(storeId, userId, {
      page,
      limit,
    });
    return successResponse(result);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

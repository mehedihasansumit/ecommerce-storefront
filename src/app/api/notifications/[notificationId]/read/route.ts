import { NextRequest } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") return unauthorizedResponse();
    const { userId } = payload as JwtCustomerPayload;

    const { notificationId } = await params;
    const notification = await NotificationService.markRead(
      storeId,
      userId,
      notificationId
    );
    if (!notification) return notFoundResponse("Notification not found");
    return successResponse(notification);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

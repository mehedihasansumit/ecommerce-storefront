import { NotificationService } from "@/features/notifications/service";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const announcements = await NotificationService.getActiveAnnouncements(storeId);
    return successResponse({ announcements });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

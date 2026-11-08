import { NotificationService } from "@/features/notifications/service";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const announcements = await NotificationService.getActiveAnnouncements(storeId);
    const res = successResponse({ announcements });
    // Cloudflare keeps a 1-minute edge copy; browsers keep none, so a new or
    // ended announcement shows on the next page view after that minute.
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

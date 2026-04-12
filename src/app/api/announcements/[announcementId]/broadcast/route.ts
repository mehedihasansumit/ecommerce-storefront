import { NextRequest } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { storeId } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_CREATE))
      return forbiddenResponse("Missing permission");

    const { announcementId } = await params;
    const result = await NotificationService.broadcastAnnouncement(storeId, announcementId);
    return successResponse(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Announcement not found") return errorResponse(err.message, 404);
      if (err.message === "No email subscribers found") return errorResponse(err.message, 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

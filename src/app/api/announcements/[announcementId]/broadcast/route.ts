import { NextRequest } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, serviceErrorResponse } from "@/shared/lib/api-response";
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
    // Emailing every subscriber is its own permission, not "create".
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_SEND))
      return forbiddenResponse("Missing permission: announcements.send");

    const { announcementId } = await params;
    const result = await NotificationService.broadcastAnnouncement(storeId, announcementId);
    return successResponse(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Announcement not found") return serviceErrorResponse(err, 404);
      if (err.message === "No email subscribers found") return serviceErrorResponse(err, 400);
      if (err.message === "Announcement already sent") return serviceErrorResponse(err, 409);
      if (err.message === "Failed to send") return errorResponse("No emails could be sent; try again later", 502);
    }
    return errorResponse("Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import { updateAnnouncementSchema } from "@/features/notifications/schemas";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

type Params = { params: Promise<{ announcementId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { announcementId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_VIEW))
      return forbiddenResponse("Missing permission");

    const announcement = await NotificationService.getAnnouncement(storeId, announcementId);
    if (!announcement) return notFoundResponse("Announcement not found");
    return successResponse(announcement);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { announcementId } = await params;
    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_CREATE))
      return forbiddenResponse("Missing permission");

    const validated = updateAnnouncementSchema.parse(rest);
    const announcement = await NotificationService.updateAnnouncement(
      storeId,
      announcementId,
      validated
    );
    if (!announcement) return notFoundResponse("Announcement not found");
    return successResponse(announcement);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message || "Validation error", 400);
    }
    if (err instanceof Error) return errorResponse(err.message, 400);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { announcementId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_CREATE))
      return forbiddenResponse("Missing permission");

    const deleted = await NotificationService.deleteAnnouncement(storeId, announcementId);
    if (!deleted) return notFoundResponse("Announcement not found");
    return successResponse({ message: "Announcement deleted" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

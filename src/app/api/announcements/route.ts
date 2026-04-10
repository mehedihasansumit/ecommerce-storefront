import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/features/notifications/service";
import { createAnnouncementSchema } from "@/features/notifications/schemas";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_VIEW))
      return forbiddenResponse("Missing permission");

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const result = await NotificationService.listAnnouncements(storeId, { page });
    return successResponse(result);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.ANNOUNCEMENTS_CREATE))
      return forbiddenResponse("Missing permission");

    const validated = createAnnouncementSchema.parse(rest);
    const announcement = await NotificationService.createAnnouncement(
      storeId,
      admin._id,
      validated
    );
    return NextResponse.json(announcement, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message || "Validation error", 400);
    }
    if (err instanceof Error) return errorResponse(err.message, 400);
    return errorResponse("Internal server error", 500);
  }
}

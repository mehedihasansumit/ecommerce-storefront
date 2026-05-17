import { NextRequest } from "next/server";
import { CampaignService } from "@/features/campaigns/service";
import { updateCampaignSchema } from "@/features/campaigns/schemas";
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

type Params = { params: Promise<{ campaignId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { campaignId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.CAMPAIGNS_VIEW))
      return forbiddenResponse("Missing permission");

    const campaign = await CampaignService.getById(storeId, campaignId);
    if (!campaign) return notFoundResponse("Campaign not found");
    return successResponse(campaign);
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { campaignId } = await params;
    const body = await request.json();
    const { storeId, ...rest } = body;

    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.CAMPAIGNS_EDIT))
      return forbiddenResponse("Missing permission");

    const validated = updateCampaignSchema.parse(rest);
    const campaign = await CampaignService.update(storeId, campaignId, validated);
    if (!campaign) return notFoundResponse("Campaign not found");
    return successResponse(campaign);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0]?.message || "Validation error", 400);
    }
    if (err instanceof Error) {
      return errorResponse(err.message, 400);
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();

    const { campaignId } = await params;
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) return errorResponse("storeId is required", 400);
    if (!canAccessStore(admin, storeId)) return forbiddenResponse("No access to this store");
    if (!hasPermission(admin, PERMISSIONS.CAMPAIGNS_DELETE))
      return forbiddenResponse("Missing permission");

    const deleted = await CampaignService.delete(storeId, campaignId);
    if (!deleted) return notFoundResponse("Campaign not found");
    return successResponse({ message: "Campaign deleted" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

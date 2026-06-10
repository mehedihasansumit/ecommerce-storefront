import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/shared/lib/api-response";
import { getAdminDbUser } from "@/shared/lib/auth";
import { MaintenanceService } from "@/features/maintenance/service";
import { scanSchema } from "@/features/maintenance/schemas";

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminDbUser();
    if (!admin) return unauthorizedResponse();
    if (!admin.role.isSuperAdmin) return forbiddenResponse("Superadmin only");

    const body = await request.json().catch(() => ({}));
    const validated = scanSchema.parse(body);

    const result = await MaintenanceService.scanOrphans(validated);
    return successResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse(error.issues[0]?.message ?? "Validation failed", 422);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 500);
    }
    return errorResponse("Scan failed", 500);
  }
}

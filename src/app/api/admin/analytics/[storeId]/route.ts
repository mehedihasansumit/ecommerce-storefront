import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getAdminDbUser } from "@/shared/lib/auth";
import {
  hasPermission,
  canAccessStore,
  PERMISSIONS,
} from "@/shared/lib/permissions";
import {
  permissionDeniedResponse,
  storeAccessDeniedResponse,
} from "@/shared/lib/api-response";
import { analyticsQuerySchema } from "@/features/analytics/schemas";
import { AnalyticsService } from "@/features/analytics/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasPermission(admin, PERMISSIONS.ANALYTICS_VIEW))
      return permissionDeniedResponse(PERMISSIONS.ANALYTICS_VIEW);

    const { storeId } = await params;
    if (!canAccessStore(admin, storeId)) return storeAccessDeniedResponse();

    const { searchParams } = request.nextUrl;
    const query = analyticsQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      metric: searchParams.get("metric") ?? "summary",
    });

    const data = await AnalyticsService.getMetric(
      storeId,
      query.metric,
      query.from,
      query.to
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

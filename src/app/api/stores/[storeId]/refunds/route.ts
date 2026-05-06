import { NextRequest, NextResponse } from "next/server";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { permissionDeniedResponse, storeAccessDeniedResponse } from "@/shared/lib/api-response";
import { OrderService } from "@/features/orders/service";
import type { RefundRequestStatus } from "@/features/orders/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(admin, PERMISSIONS.REFUNDS_VIEW))
      return permissionDeniedResponse(PERMISSIONS.REFUNDS_VIEW);

    const { storeId } = await params;
    if (!canAccessStore(admin, storeId))
      return storeAccessDeniedResponse();

    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") as RefundRequestStatus | null;
    const page = Number(sp.get("page") ?? "1");
    const limit = Number(sp.get("limit") ?? "20");

    const result = await OrderService.getRefundQueue(storeId, {
      status: status ?? undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

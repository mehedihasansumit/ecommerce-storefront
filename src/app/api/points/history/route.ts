import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { PointService } from "@/features/points/service";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const customerPayload = payload as JwtCustomerPayload;
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

    const result = await PointService.getHistory(
      storeId,
      customerPayload.userId,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

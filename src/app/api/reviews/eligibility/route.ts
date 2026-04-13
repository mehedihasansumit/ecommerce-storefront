import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { ReviewService } from "@/features/reviews/service";
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

    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const customerPayload = payload as JwtCustomerPayload;
    const eligibility = await ReviewService.getEligibility(
      storeId,
      customerPayload.userId,
      productId
    );

    return NextResponse.json(eligibility);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

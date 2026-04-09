import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = payload as JwtCustomerPayload;
    const { addressId } = await params;

    const addresses = await AuthService.setDefaultAddress(storeId, userId, addressId);

    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

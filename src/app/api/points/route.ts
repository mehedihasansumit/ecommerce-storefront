import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { PointService } from "@/features/points/service";
import { redeemPointsSchema } from "@/features/reviews/schemas";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const customerPayload = payload as JwtCustomerPayload;
    const balance = await PointService.getBalance(storeId, customerPayload.userId);

    return NextResponse.json(balance);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const customerPayload = payload as JwtCustomerPayload;
    const body = await request.json();
    const validated = redeemPointsSchema.parse(body);

    const result = await PointService.redeem(
      storeId,
      customerPayload.userId,
      validated.points
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";
import { addressSchema } from "@/features/auth/schemas";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { ZodError } from "zod";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = payload as JwtCustomerPayload;
    const addresses = await AuthService.getAddresses(storeId, userId);

    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId } = payload as JwtCustomerPayload;
    const body = await request.json();
    const validated = addressSchema.parse(body);

    const addresses = await AuthService.addAddress(storeId, userId, validated);

    return NextResponse.json({ addresses }, { status: 201 });
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

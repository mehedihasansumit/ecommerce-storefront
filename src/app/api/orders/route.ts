import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { OrderService } from "@/features/orders/service";
import { createOrderSchema } from "@/features/orders/schemas";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Get userId if logged in (for coupon tracking)
    let userId: string | undefined;
    const payload = await getCustomerToken();
    if (payload && payload.type === "customer") {
      userId = (payload as JwtCustomerPayload).userId;
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "";

    const order = await OrderService.create(storeId, validated, userId, clientIp);

    return NextResponse.json(
      { orderNumber: order.orderNumber, orderId: order._id },
      { status: 201 }
    );
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { grantOrderAccess } from "@/shared/lib/order-access";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { OrderService } from "@/features/orders/service";
import { createOrderSchema } from "@/features/orders/schemas";
import { ZodError } from "zod";
import { serviceErrorResponse } from "@/shared/lib/api-response";
import { RATE_RULES, checkRateLimits, getClientIp, tooManyRequestsResponse } from "@/shared/lib/rate-limit";

export async function GET(_request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (payload as JwtCustomerPayload).userId;
    const orders = await OrderService.getByUser(storeId, userId);
    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Stops scripted fake orders (cash on delivery costs a courier trip each).
    const limited = await checkRateLimits([
      [RATE_RULES.checkoutIp, getClientIp(request)],
      [RATE_RULES.checkoutPhone, `${storeId}:${validated.shippingAddress.phone}`],
    ]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);

    // Get userId if logged in (for coupon tracking)
    let userId: string | undefined;
    const payload = await getCustomerToken();
    if (payload && payload.type === "customer") {
      userId = (payload as JwtCustomerPayload).userId;
    }

    const clientIp = getClientIp(request);

    const order = await OrderService.create(storeId, validated, userId, clientIp);
    // Lets this browser open the confirmation page without logging in.
    await grantOrderAccess(storeId, order._id);

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
      return serviceErrorResponse(error, 400);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

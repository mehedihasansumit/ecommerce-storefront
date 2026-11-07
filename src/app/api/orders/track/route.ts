import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getStoreId } from "@/shared/lib/tenant";
import { OrderService } from "@/features/orders/service";
import { toTrackResult } from "@/features/orders/tracking";
import { grantOrderAccess } from "@/shared/lib/order-access";
import { RATE_RULES, checkRateLimits, getClientIp, tooManyRequestsResponse } from "@/shared/lib/rate-limit";

const trackSchema = z
  .object({
    orderNumber: z.string().trim().max(32).optional(),
    phone: z.string().trim().max(20).optional(),
  })
  .refine((v) => !!v.orderNumber || !!v.phone, {
    message: "Order number or phone required",
  });

const notFound = () => NextResponse.json({ error: "Order not found" }, { status: 404 });

/**
 * Public order lookup. Only order number + phone together prove ownership: that
 * returns the order id and grants this browser the order pass, so the full
 * order (name, address, phone) opens. Either one alone returns a summary.
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const { orderNumber, phone } = trackSchema.parse(body);

    // Stops trying phone numbers one by one, and guessing the hidden order number.
    const limited = await checkRateLimits([
      [RATE_RULES.trackIp, getClientIp(request)],
      [RATE_RULES.trackPhone, phone ? `${storeId}:${phone}` : null],
    ]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);

    if (orderNumber && phone) {
      const order = await OrderService.getByOrderNumberAndPhone(storeId, orderNumber, phone);
      if (!order) return notFound();
      await grantOrderAccess(storeId, order._id);
      return NextResponse.json({ orders: [toTrackResult(order, "verified")] });
    }

    if (orderNumber) {
      const order = await OrderService.getByOrderNumber(storeId, orderNumber);
      if (!order) return notFound();
      return NextResponse.json({ orders: [toTrackResult(order, "number")] });
    }

    const orders = await OrderService.getByPhone(storeId, phone!);
    if (orders.length === 0) return notFound();
    return NextResponse.json({ orders: orders.map((o) => toTrackResult(o, "phone")) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getAdminDbUser, getCustomerToken } from "@/shared/lib/auth";
import { hasOrderAccess } from "@/shared/lib/order-access";
import type { JwtCustomerPayload } from "@/features/auth/types";
import type { IOrder } from "@/features/orders/types";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { permissionDeniedResponse, storeAccessDeniedResponse } from "@/shared/lib/api-response";
import { OrderService } from "@/features/orders/service";
import { z } from "zod";

const ORDER_STATUSES = [
  "pending","confirmed","processing","shipped","delivered","cancelled",
] as const;

const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().optional(),
});

const updatePaymentSchema = z.object({
  storeId: z.string(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  discount: z.number().min(0).optional(),
});

/**
 * The logged-in customer who placed it, or a browser holding the order pass
 * (given at checkout, or after order number + phone matched on the track page).
 */
async function canViewOrder(storeId: string, order: IOrder): Promise<boolean> {
  const payload = await getCustomerToken();
  if (payload?.type === "customer") {
    const customer = payload as JwtCustomerPayload;
    if (customer.storeId === storeId && order.userId && order.userId === customer.userId) {
      return true;
    }
  }
  return hasOrderAccess(storeId, order._id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { orderId } = await params;
    const order = await OrderService.getById(storeId, orderId);
    // Same 404 whether the order doesn't exist or isn't this shopper's, so an id
    // alone reveals nothing.
    if (!order || !(await canViewOrder(storeId, order)))
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // The shopper's own IP is kept for fraud checks; it's not theirs to download.
    const { clientIp: _ip, ...publicOrder } = order;
    void _ip;
    return NextResponse.json({ order: publicOrder });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(admin, PERMISSIONS.ORDERS_UPDATE_STATUS))
      return permissionDeniedResponse(PERMISSIONS.ORDERS_UPDATE_STATUS);

    // Admin passes storeId in body since middleware skips /api
    const body = await request.json();
    const { storeId, ...rest } = body;
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!canAccessStore(admin, storeId))
      return storeAccessDeniedResponse();

    const { status, note } = updateStatusSchema.parse(rest);
    const { orderId } = await params;

    const order = await OrderService.updateStatus(storeId, orderId, status, note);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { storeId, paymentStatus, discount } = updatePaymentSchema.parse(body);

    if (!canAccessStore(admin, storeId))
      return storeAccessDeniedResponse();

    // Check specific payment permissions
    if (paymentStatus !== undefined && !hasPermission(admin, PERMISSIONS.PAYMENTS_UPDATE_STATUS))
      return permissionDeniedResponse(PERMISSIONS.PAYMENTS_UPDATE_STATUS);
    if (discount !== undefined && !hasPermission(admin, PERMISSIONS.PAYMENTS_DISCOUNT))
      return permissionDeniedResponse(PERMISSIONS.PAYMENTS_DISCOUNT);
    const { orderId } = await params;

    let order = null;

    if (paymentStatus !== undefined) {
      order = await OrderService.updatePaymentStatus(storeId, orderId, paymentStatus);
    }

    if (discount !== undefined) {
      order = await OrderService.applyDiscount(storeId, orderId, discount);
    }

    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

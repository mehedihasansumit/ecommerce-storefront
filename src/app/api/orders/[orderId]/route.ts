import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";
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
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ order });
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
    const adminToken = (await getAdminToken()) as JwtAdminPayload | null;
    if (!adminToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(adminToken, PERMISSIONS.ORDERS_UPDATE_STATUS))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Admin passes storeId in body since middleware skips /api
    const body = await request.json();
    const { storeId, ...rest } = body;
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!canAccessStore(adminToken, storeId))
      return NextResponse.json({ error: "No access to this store" }, { status: 403 });

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
    const adminToken = (await getAdminToken()) as JwtAdminPayload | null;
    if (!adminToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { storeId, paymentStatus, discount } = updatePaymentSchema.parse(body);

    if (!canAccessStore(adminToken, storeId))
      return NextResponse.json({ error: "No access to this store" }, { status: 403 });

    // Check specific payment permissions
    if (paymentStatus !== undefined && !hasPermission(adminToken, PERMISSIONS.PAYMENTS_UPDATE_STATUS))
      return NextResponse.json({ error: "Forbidden: missing payments.updateStatus" }, { status: 403 });
    if (discount !== undefined && !hasPermission(adminToken, PERMISSIONS.PAYMENTS_DISCOUNT))
      return NextResponse.json({ error: "Forbidden: missing payments.discount" }, { status: 403 });
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

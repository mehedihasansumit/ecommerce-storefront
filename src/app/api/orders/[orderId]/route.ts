import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getAdminToken } from "@/shared/lib/auth";
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
    const adminToken = await getAdminToken();
    if (!adminToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Admin passes storeId in body since middleware skips /api
    const body = await request.json();
    const { storeId, ...rest } = body;
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });

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
    const adminToken = await getAdminToken();
    if (!adminToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { storeId, paymentStatus, discount } = updatePaymentSchema.parse(body);
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
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

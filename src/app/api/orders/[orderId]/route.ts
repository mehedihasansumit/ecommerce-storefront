import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getAdminToken } from "@/shared/lib/auth";
import { OrderService } from "@/features/orders/service";
import { z } from "zod";

const ORDER_STATUSES = [
  "pending","confirmed","processing","shipped","delivered","cancelled",
] as const;

const updateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
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

    const { status } = updateStatusSchema.parse(rest);
    const { orderId } = await params;

    const order = await OrderService.updateStatus(storeId, orderId, status);
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

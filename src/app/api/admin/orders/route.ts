import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import type { JwtAdminPayload } from "@/features/auth/types";
import { OrderService } from "@/features/orders/service";
import { createOrderSchema } from "@/features/orders/schemas";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const adminToken = (await getAdminToken()) as JwtAdminPayload | null;
    if (!adminToken)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(adminToken, PERMISSIONS.ORDERS_UPDATE_STATUS))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { storeId, ...rest } = body;
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!canAccessStore(adminToken, storeId))
      return NextResponse.json({ error: "No access to this store" }, { status: 403 });

    const validated = createOrderSchema.parse(rest);
    const order = await OrderService.create(storeId, validated);

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

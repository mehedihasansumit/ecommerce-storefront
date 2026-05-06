import { NextRequest, NextResponse } from "next/server";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { permissionDeniedResponse, storeAccessDeniedResponse } from "@/shared/lib/api-response";
import { OrderService } from "@/features/orders/service";
import { createRefundRequestSchema, reviewRefundRequestSchema } from "@/features/orders/schemas";
import type { JwtCustomerPayload } from "@/features/auth/types";
import { z } from "zod";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (payload as JwtCustomerPayload).userId;

    const { orderId } = await params;
    const body = await request.json();
    const input = createRefundRequestSchema.parse(body);

    const order = await OrderService.requestRefund(storeId, orderId, input, userId);
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payload = await getCustomerToken();
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (payload as JwtCustomerPayload).userId;

    const { orderId } = await params;
    const order = await OrderService.cancelRefundRequest(storeId, orderId, userId);
    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
    if (!hasPermission(admin, PERMISSIONS.REFUNDS_MANAGE))
      return permissionDeniedResponse(PERMISSIONS.REFUNDS_MANAGE);

    const body = await request.json();
    const { storeId, ...rest } = body;
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!canAccessStore(admin, storeId))
      return storeAccessDeniedResponse();

    const input = reviewRefundRequestSchema.parse(rest);
    const { orderId } = await params;

    const order = await OrderService.reviewRefund(storeId, orderId, admin._id, input);
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const admin = await getAdminDbUser();
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!hasPermission(admin, PERMISSIONS.REFUNDS_VIEW))
      return permissionDeniedResponse(PERMISSIONS.REFUNDS_VIEW);

    const body = _request.nextUrl.searchParams;
    const storeId = body.get("storeId");
    if (!storeId)
      return NextResponse.json({ error: "storeId required" }, { status: 400 });
    if (!canAccessStore(admin, storeId))
      return storeAccessDeniedResponse();

    const { orderId } = await params;
    const order = await OrderService.getById(storeId, orderId);
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ refundRequest: order.refundRequest ?? null });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

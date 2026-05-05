import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getStoreId } from "@/shared/lib/tenant";
import { OrderService } from "@/features/orders/service";
import { OrderRepository } from "@/features/orders/repository";

const trackSchema = z
  .object({
    orderNumber: z.string().trim().optional(),
    phone: z.string().trim().optional(),
  })
  .refine((v) => !!v.orderNumber || !!v.phone, {
    message: "Order number or phone required",
  });

type TrackResultOrder = {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

function toResult(o: {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string | Date;
}): TrackResultOrder {
  return {
    orderId: o._id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: o.total,
    createdAt:
      typeof o.createdAt === "string"
        ? o.createdAt
        : new Date(o.createdAt).toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const { orderNumber, phone } = trackSchema.parse(body);

    // Both → strict match (single result)
    if (orderNumber && phone) {
      const order = await OrderService.getByOrderNumberAndPhone(
        storeId,
        orderNumber,
        phone
      );
      if (!order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ orders: [toResult(order)] });
    }

    // Order number only → single lookup
    if (orderNumber) {
      const order = await OrderRepository.findByOrderNumber(
        storeId,
        orderNumber.toUpperCase()
      );
      if (!order)
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ orders: [toResult(order)] });
    }

    // Phone only → list
    const orders = await OrderService.getByPhone(storeId, phone!);
    if (orders.length === 0)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ orders: orders.map(toResult) });
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

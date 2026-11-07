import type { IOrder } from "./types";

/**
 * One row on the public track page. `orderId` (the key to the full order) is set
 * only after order number + phone both matched; a lookup by phone alone gets a
 * masked order number, so knowing someone's phone doesn't reveal their order.
 */
export type TrackResultOrder = {
  orderId: string | null;
  orderNumber: string;
  masked: boolean;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
};

/** Characters left visible at the end. With 8 random characters, 6 hidden = 36^6 guesses. */
const VISIBLE_TAIL = 2;

/** `ORD-AB12CD34` → `ORD-••••••34`. */
export function maskOrderNumber(orderNumber: string): string {
  const dash = orderNumber.indexOf("-");
  const prefix = dash >= 0 ? orderNumber.slice(0, dash + 1) : "";
  const rest = orderNumber.slice(prefix.length);
  const tail = rest.length > VISIBLE_TAIL ? rest.slice(-VISIBLE_TAIL) : "";
  return prefix + "•".repeat(Math.max(rest.length - tail.length, 4)) + tail;
}

type TrackableOrder = Pick<IOrder, "_id" | "orderNumber" | "status" | "paymentStatus" | "total"> & {
  createdAt: string | Date;
};

/**
 * - "verified": order number + phone matched → full number and the order id.
 * - "phone":    phone only → masked number, no id.
 * - "number":   order number only (the shopper typed it) → full number, no id.
 */
export function toTrackResult(
  order: TrackableOrder,
  proof: "verified" | "phone" | "number",
): TrackResultOrder {
  return {
    orderId: proof === "verified" ? order._id : null,
    orderNumber: proof === "phone" ? maskOrderNumber(order.orderNumber) : order.orderNumber,
    masked: proof === "phone",
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    createdAt:
      typeof order.createdAt === "string" ? order.createdAt : new Date(order.createdAt).toISOString(),
  };
}

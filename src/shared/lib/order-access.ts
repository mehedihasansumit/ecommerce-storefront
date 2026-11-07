import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { jwtKey } from "./auth";

/**
 * Guest "order pass": a signed, httpOnly cookie listing the orders this browser
 * may open without logging in. Granted when the order is placed, and when the
 * shopper proves they own it on the track page (order number + phone). Without
 * it, `GET /api/orders/[id]` only serves the logged-in owner, so an order id
 * learned elsewhere no longer reveals a customer's name, address and phone.
 */
export const ORDER_ACCESS_COOKIE = "order-access";
const AUDIENCE = "order-access"; // never accepted as a login token, and vice versa
const MAX_ORDERS = 20;
const TTL_DAYS = 30;

type OrderPass = { storeId: string; orderIds: string[] };

async function readPass(): Promise<OrderPass | null> {
  const token = (await cookies()).get(ORDER_ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtKey(), { audience: AUDIENCE });
    if (typeof payload.storeId !== "string" || !Array.isArray(payload.orderIds)) return null;
    return {
      storeId: payload.storeId,
      orderIds: payload.orderIds.filter((id): id is string => typeof id === "string"),
    };
  } catch {
    return null;
  }
}

/** True when this browser's pass covers `orderId` in `storeId`. */
export async function hasOrderAccess(storeId: string, orderId: string): Promise<boolean> {
  const pass = await readPass();
  return !!pass && pass.storeId === storeId && pass.orderIds.includes(orderId);
}

/** Adds `orderId` to this browser's pass (keeps the newest MAX_ORDERS). Route handlers only. */
export async function grantOrderAccess(storeId: string, orderId: string): Promise<void> {
  const pass = await readPass();
  const ids = pass?.storeId === storeId ? pass.orderIds.filter((id) => id !== orderId) : [];
  ids.push(orderId);

  const token = await new SignJWT({ storeId, orderIds: ids.slice(-MAX_ORDERS) })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(jwtKey());

  (await cookies()).set(ORDER_ACCESS_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_DAYS * 24 * 60 * 60,
  });
}

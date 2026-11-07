import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { JwtPayload, JwtAdminPayload, JwtCustomerPayload, IAdminUserWithRole } from "@/features/auth/types";
import { getStoreId } from "./tenant";

const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

let signingKey: Uint8Array | undefined;

/**
 * The key that signs and verifies every login token and signed cookie (e.g. the
 * guest order pass in order-access.ts). There is deliberately no fallback: with
 * a known default anyone could sign their own admin token, so a missing
 * JWT_SECRET fails loudly instead. Read on first use, not at import, because
 * `next build` runs without it.
 */
export function jwtKey(): Uint8Array {
  if (signingKey) return signingKey;
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  if (secret.length < 32) {
    console.warn("[auth] JWT_SECRET is shorter than 32 characters; use a long random value");
  }
  return (signingKey = new TextEncoder().encode(secret));
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .setIssuedAt()
    .sign(jwtKey());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * The logged-in customer, or null. A customer account belongs to one store, so
 * its token only counts on that store's domain: one copied to another store's
 * domain is ignored (it used to read store A's points while redeeming on store B).
 */
export async function getCustomerToken(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer-token")?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (payload?.type === "customer") {
    const storeId = await getStoreId();
    if (!storeId || (payload as JwtCustomerPayload).storeId !== storeId) return null;
  }
  return payload;
}

export async function getAdminToken(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Returns the full admin record from the database with role populated.
 * Use this instead of relying on JWT payload for permission checks,
 * since the JWT can be stale after a permission/role update.
 */
export async function getAdminDbUser(): Promise<IAdminUserWithRole | null> {
  const payload = (await getAdminToken()) as JwtAdminPayload | null;
  if (!payload?.adminId) return null;
  const { AuthService } = await import("@/features/auth/service");
  return AuthService.getAdminWithRole(payload.adminId);
}

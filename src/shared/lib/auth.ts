import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { JwtPayload, JwtAdminPayload, IAdminUserWithRole } from "@/features/auth/types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCustomerToken(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer-token")?.value;
  if (!token) return null;
  return verifyToken(token);
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

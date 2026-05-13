import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { db } from "@/db/client";
import { users } from "@/db/schema/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") return unauthorizedResponse();
    const { userId } = payload as JwtCustomerPayload;

    const [user] = await db
      .select({ notificationPreferences: users.notificationPreferences })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const prefs = (user?.notificationPreferences as { email?: boolean; sms?: boolean; inApp?: boolean } | null) ?? {
      email: true,
      sms: false,
      inApp: true,
    };

    return successResponse({ preferences: prefs });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") return unauthorizedResponse();
    const { userId } = payload as JwtCustomerPayload;

    const body = await request.json();
    const { email, sms, inApp } = body;
    const prefs = { email: email ?? true, sms: sms ?? false, inApp: inApp ?? true };

    await db
      .update(users)
      .set({ notificationPreferences: prefs, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return successResponse({ preferences: prefs });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

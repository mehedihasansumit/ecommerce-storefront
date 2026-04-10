import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/shared/lib/api-response";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import { UserModel } from "@/features/auth/model";
import type { JwtCustomerPayload } from "@/features/auth/types";
import dbConnect from "@/shared/lib/db";

export async function GET() {
  try {
    const storeId = await getStoreId();
    if (!storeId) return errorResponse("Store not found", 400);

    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") return unauthorizedResponse();
    const { userId } = payload as JwtCustomerPayload;

    await dbConnect();
    const user = await UserModel.findById(userId, {
      notificationPreferences: 1,
    }).lean();

    const prefs = (user as { notificationPreferences?: { email?: boolean; sms?: boolean; inApp?: boolean } })
      ?.notificationPreferences ?? { email: true, sms: false, inApp: true };

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

    await dbConnect();
    await UserModel.findByIdAndUpdate(userId, {
      notificationPreferences: {
        email: email ?? true,
        sms: sms ?? false,
        inApp: inApp ?? true,
      },
    });

    return successResponse({
      preferences: { email: email ?? true, sms: sms ?? false, inApp: inApp ?? true },
    });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

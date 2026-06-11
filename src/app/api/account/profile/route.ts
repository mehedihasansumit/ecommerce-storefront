import { NextRequest, NextResponse } from "next/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthService } from "@/features/auth/service";
import { updateProfileSchema } from "@/features/auth/schemas";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function PATCH(request: NextRequest) {
  try {
    const payload = await getCustomerToken();
    if (!payload || payload.type !== "customer") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const { userId } = payload as JwtCustomerPayload;

    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const user = await AuthService.updateCustomerProfile(userId, validated);
    return NextResponse.json({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "update failed";
    const status = message.toLowerCase().includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

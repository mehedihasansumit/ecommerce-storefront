import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { trackEventSchema } from "@/features/analytics/schemas";
import { AnalyticsService } from "@/features/analytics/service";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const body = await request.json();

    // Extract userId from customer JWT cookie (server-side)
    let userId: string | undefined;
    try {
      const token = await getCustomerToken();
      if (token && (token as JwtCustomerPayload).type === "customer") {
        userId = (token as JwtCustomerPayload).userId;
      }
    } catch {
      // No valid token — anonymous user
    }

    const data = trackEventSchema.parse({
      ...body,
      storeId,
      ...(userId ? { userId } : {}),
    });

    // Fire-and-forget — never block the storefront response
    AnalyticsService.track(data).catch(() => {});

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

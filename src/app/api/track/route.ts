import { NextRequest, NextResponse } from "next/server";
import { MAX_EVENTS_PER_REQUEST, trackEventSchema } from "@/features/analytics/schemas";
import { AnalyticsService } from "@/features/analytics/service";
import { getStoreId } from "@/shared/lib/tenant";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

/**
 * Activity events from the storefront. The browser sends them in batches
 * (`{ events: [...] }`, see useTrackEvent); a single event object is still
 * accepted from pages loaded before batching shipped. Store and customer come
 * from the request, never from the body.
 */
export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const body = await request.json();
    const raw: unknown[] = Array.isArray(body?.events) ? body.events : [body];
    if (raw.length === 0 || raw.length > MAX_EVENTS_PER_REQUEST) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let userId: string | undefined;
    const token = await getCustomerToken().catch(() => null);
    if (token && (token as JwtCustomerPayload).type === "customer") {
      userId = (token as JwtCustomerPayload).userId;
    }

    // Invalid events are skipped; the rest are still counted.
    for (const event of raw) {
      const parsed = trackEventSchema.safeParse({
        ...(event && typeof event === "object" ? event : {}),
        storeId,
        userId,
      });
      if (parsed.success) await AnalyticsService.track(parsed.data).catch(() => {});
    }

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

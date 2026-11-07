import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { SubscriberService } from "@/features/subscribers/service";
import { subscribeSchema } from "@/features/subscribers/schemas";
import { successResponse, errorResponse } from "@/shared/lib/api-response";
import { RATE_RULES, checkRateLimits, getClientIp, tooManyRequestsResponse } from "@/shared/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    const limited = await checkRateLimits([[RATE_RULES.subscribeIp, getClientIp(request)]]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);
    await SubscriberService.subscribe(validated.storeId, {
      email: validated.email,
      phone: validated.phone,
    });
    return successResponse({ message: "Subscribed successfully" }, 201);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse(err.issues[0].message, 400);
    }
    if (err instanceof Error && err.message === "Already subscribed") {
      return errorResponse("Already subscribed", 409);
    }
    return errorResponse("Internal server error", 500);
  }
}

import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { NewsletterService } from "@/features/newsletters/service";
import { subscribeSchema } from "@/features/newsletters/schemas";
import { successResponse, errorResponse } from "@/shared/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);
    await NewsletterService.subscribe(validated.storeId, validated.email);
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

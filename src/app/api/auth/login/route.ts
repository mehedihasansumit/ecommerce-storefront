import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/features/auth/schemas";
import { AuthService } from "@/features/auth/service";
import { getStoreId } from "@/shared/lib/tenant";
import { serviceErrorResponse } from "@/shared/lib/api-response";
import { RATE_RULES, checkRateLimits, getClientIp, tooManyRequestsResponse } from "@/shared/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const storeId = await getStoreId();
    if (!storeId)
      return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Before the password check: stops guessing a customer's password.
    const limited = await checkRateLimits([
      [RATE_RULES.loginIp, getClientIp(request)],
      [RATE_RULES.loginEmail, `${storeId}:${email}`],
    ]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);

    const { user, token } = await AuthService.loginCustomer(storeId, email, password);

    const response = NextResponse.json({ user }, { status: 200 });
    response.cookies.set("customer-token", token, {
      httpOnly: true,
      // HTTPS-only in production, so the login token never travels over plain HTTP.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return serviceErrorResponse(error, 401);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/features/auth/service";
import { z } from "zod";
import { fa } from "zod/locales";
import { RATE_RULES, checkRateLimits, getClientIp, tooManyRequestsResponse } from "@/shared/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Before the password check: stops guessing an admin's password.
    const limited = await checkRateLimits([
      [RATE_RULES.adminLoginIp, getClientIp(request)],
      [RATE_RULES.adminLoginEmail, email],
    ]);
    if (!limited.ok) return tooManyRequestsResponse(limited.retryAfterSeconds);

    const { admin, token } = await AuthService.loginAdmin(email, password);

    const response = NextResponse.json(
      {
        success: true,
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role.name,
        },
      },
      { status: 200 }
    );

    // Set admin-token as HttpOnly cookie
    response.cookies.set({
      name: "admin-token",
      value: token,
      httpOnly: true,
      // HTTPS-only in production, so the login token never travels over plain HTTP.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 422 }
      );
    }

    if (error instanceof Error) {
      if (error.message === "Invalid email or password") {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

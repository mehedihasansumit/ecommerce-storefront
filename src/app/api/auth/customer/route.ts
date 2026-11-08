import { NextResponse } from "next/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";

// The logged-out answer is the same for everyone, so Cloudflare keeps a short
// edge copy (docs/deploy/cloudflare-page-cache.md). Browsers must never keep one:
// a cached { user: null } would show a shopper as logged out after logging in.
const NO_BROWSER_CACHE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    return NextResponse.json({ user: null }, { status: 200, headers: NO_BROWSER_CACHE });
  }
  const { userId, email } = payload as JwtCustomerPayload;
  const user = await AuthRepository.findUserById(userId);
  return NextResponse.json(
    {
      user: {
        userId,
        email,
        name: user?.name ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        avatarPosition: user?.avatarPosition ?? null,
      },
    },
    { status: 200, headers: NO_BROWSER_CACHE },
  );
}

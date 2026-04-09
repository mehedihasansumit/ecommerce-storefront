import { NextResponse } from "next/server";
import { getCustomerToken } from "@/shared/lib/auth";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET() {
  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const { userId, email } = payload as JwtCustomerPayload;
  return NextResponse.json({ user: { userId, email } }, { status: 200 });
}

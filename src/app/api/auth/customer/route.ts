import { NextResponse } from "next/server";
import { getCustomerToken } from "@/shared/lib/auth";
import { AuthRepository } from "@/features/auth/repository";
import type { JwtCustomerPayload } from "@/features/auth/types";

export async function GET() {
  const payload = await getCustomerToken();
  if (!payload || payload.type !== "customer") {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const { userId, email } = payload as JwtCustomerPayload;
  const user = await AuthRepository.findUserById(userId);
  return NextResponse.json({ user: { userId, email, name: user?.name ?? null } }, { status: 200 });
}

import { NextRequest, NextResponse } from "next/server";
import { getUnions } from "@/shared/lib/bd-geo";

export async function GET(request: NextRequest) {
  const upazilaId = request.nextUrl.searchParams.get("upazilaId");
  if (!upazilaId) return NextResponse.json({ error: "upazilaId is required" }, { status: 400 });
  return NextResponse.json(getUnions(upazilaId));
}

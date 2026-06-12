import { NextRequest, NextResponse } from "next/server";
import { getDistricts } from "@/shared/lib/bd-geo";

export async function GET(request: NextRequest) {
  const divisionId = request.nextUrl.searchParams.get("divisionId");
  if (!divisionId) return NextResponse.json({ error: "divisionId is required" }, { status: 400 });
  return NextResponse.json(getDistricts(divisionId));
}

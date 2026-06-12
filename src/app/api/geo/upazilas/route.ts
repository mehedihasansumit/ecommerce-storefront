import { NextRequest, NextResponse } from "next/server";
import { getUpazilas } from "@/shared/lib/bd-geo";

export async function GET(request: NextRequest) {
  const districtId = request.nextUrl.searchParams.get("districtId");
  if (!districtId) return NextResponse.json({ error: "districtId is required" }, { status: 400 });
  return NextResponse.json(getUpazilas(districtId));
}

import { NextResponse } from "next/server";
import { getDivisions } from "@/shared/lib/bd-geo";

// Public reference data (not store-scoped). Cached aggressively.
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(getDivisions());
}

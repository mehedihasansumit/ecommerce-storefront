import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const localeSchema = z.object({
  locale: z.enum(["en", "bn"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locale } = localeSchema.parse(body);

    const response = NextResponse.json({ success: true });
    response.cookies.set("NEXT_LOCALE", locale, {
      maxAge: 31536000, // 1 year
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
}

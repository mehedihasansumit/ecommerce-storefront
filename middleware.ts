import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Set default locale cookie if not present (for storefront only)
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api")) {
    const response = NextResponse.next();
    if (!request.cookies.has("NEXT_LOCALE")) {
      response.cookies.set("NEXT_LOCALE", "en", {
        maxAge: 31536000, // 1 year
        path: "/",
      });
    }
    return response;
  }

  // Admin auth guard: protect /admin/* except /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("admin-token")?.value;
    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};

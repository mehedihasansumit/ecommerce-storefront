import { NextRequest, NextResponse } from "next/server";
import { APP_SURFACE_HEADER } from "@/shared/lib/app-surface";

// Next 16 "proxy" (formerly middleware). It must live in src/ next to app/: the old
// root-level middleware.ts was never picked up, so its admin guard never ran (the
// (protected) layout's own auth check was doing the work).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin auth guard: protect /admin/* except /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const adminToken = request.cookies.get("admin-token")?.value;

    if (!adminToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Mark admin requests so the root layout renders them brand-neutral (no tenant
  // vars, fonts or `data-tenant` on <html>) even when served from a store's domain.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(APP_SURFACE_HEADER, "admin");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*"],
};

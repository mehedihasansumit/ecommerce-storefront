import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { APP_SURFACE_HEADER } from "@/shared/lib/app-surface";
import { routing } from "@/i18n/routing";

// Storefront language routing: /bn/products/x → [locale]=bn, /products/x → en.
const handleI18nRouting = createMiddleware(routing);

// Next 16 "proxy" (formerly middleware). It must live in src/ next to app/: the old
// root-level middleware.ts was never picked up, so its admin guard never ran (the
// (protected) layout's own auth check was doing the work).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return handleI18nRouting(request);
  }

  // Admin auth guard: protect /admin/* except /admin/login
  if (!pathname.startsWith("/admin/login")) {
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
  // Admin, plus every storefront page. Skips API routes, Next internals, the
  // offline fallback page and any path with a dot (sitemap.xml, robots.txt,
  // sw.js, manifest.webmanifest, images), which live outside [locale].
  matcher: ["/admin/:path*", "/((?!api|_next|_vercel|admin|offline|.*\\..*).*)"],
};

import { NextRequest, NextResponse } from "next/server";

const storeCache = new Map<
  string,
  { storeId: string; storeSlug: string; expiry: number }
>();
const CACHE_TTL = 60_000;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];

  const cached = storeCache.get(hostname);
  if (cached && cached.expiry > Date.now()) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-store-id", cached.storeId);
    requestHeaders.set("x-store-slug", cached.storeSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  try {
    const resolveUrl = new URL("/api/stores/resolve", request.url);
    resolveUrl.searchParams.set("domain", hostname);

    const res = await fetch(resolveUrl.toString());
    if (!res.ok) {
      return NextResponse.next();
    }

    const store = await res.json();

    storeCache.set(hostname, {
      storeId: store._id,
      storeSlug: store.slug,
      expiry: Date.now() + CACHE_TTL,
    });

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-store-id", store._id);
    requestHeaders.set("x-store-slug", store.slug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

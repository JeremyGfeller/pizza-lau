import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "pizza_access_token";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/commande") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/cart") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/checkout") ||
    pathname.startsWith("/api/admin")
  );
}

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/checkout/:path*",
    "/compte/:path*",
    "/commande/:path*",
    "/admin/:path*",
    "/api/cart/:path*",
    "/api/orders/:path*",
    "/api/checkout/:path*",
    "/api/admin/:path*",
  ],
};

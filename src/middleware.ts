import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get("promptvault_session")?.value;

  // Static assets, favicon, api health are public
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isLoginPage = pathname === "/login";

  // If on login page and already has session cookie, redirect to dashboard
  if (isLoginPage && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If not on login page and no session cookie, redirect to login
  if (!isLoginPage && !sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect root / to /dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

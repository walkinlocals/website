// proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Rename this function from "middleware" to "proxy"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the landing page, static assets, and the waitlist API endpoint
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/waitlist") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Redirect all other traffic back to the home landing page
  return NextResponse.redirect(new URL("/", request.url));
}

// Keep your matcher config exactly the same
export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
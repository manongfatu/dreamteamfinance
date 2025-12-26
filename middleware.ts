import { NextRequest, NextResponse } from "next/server";

// Minimal, robust guard: protect app pages; skip API and assets
const PUBLIC_PREFIXES = ["/login", "/register", "/forgot", "/reset", "/_next", "/favicon", "/manifest.webmanifest", "/sw.js", "/public", "/icons"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Skip API routes entirely
  if (pathname.startsWith("/api")) return NextResponse.next();
  // Allow public pages/assets
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("dtf_session")?.value;
  if (!token || token.length < 10) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname || "/");
    return NextResponse.redirect(url);
  }

  // Trust presence of session cookie here; do deep verify in server routes
  return NextResponse.next();
}

// No matcher: run on all requests; function guards skip API & assets

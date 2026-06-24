import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Everything is protected by default. Only these prefixes are public; the Better
// Auth endpoints (`/api/auth/*`) are already excluded by the matcher below.
const PUBLIC_PATHS = ["/auth", "/accept-invite"];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

// Optimistic check: presence of the Better Auth session cookie. Full validation
// happens server-side in getAuthContext(); this only gates routing.
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!getSessionCookie(req);

  if (isLoggedIn || isPublic(pathname)) {
    return NextResponse.next();
  }

  // API: return a real 401 (not a redirect) for unauthenticated requests.
  if (pathname.startsWith("/api")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Pages: redirect to sign-in.
  return NextResponse.redirect(new URL("/auth/signin", req.nextUrl.origin));
}

export const config = {
  // Includes `/api` so it sits behind the auth filter, but still excludes the
  // Better Auth endpoints (`/api/auth/*`) so sign-in/callbacks work unauthenticated.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

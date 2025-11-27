import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth-server";

const AUTH_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTES = [
  "/chat",
  "/create",
  "/explore",
  "/inspiration",
  "/projects",
  "/saved",
];

// THIS IS NOT SECURE!
// This is the recommended approach to optimistically redirect users
// We recommend handling auth checks in each page/route
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = await getToken();
  const isAuthenticated = !!token;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  // Redirect unauthenticated users to login from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs", // Required for auth.api calls
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

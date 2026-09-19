import { type NextRequest, NextResponse } from "next/server";
import { getSessionKind } from "@/lib/auth-server";

const AUTH_ROUTES = ["/login", "/signup"];

/**
 * Routes a visitor reaches by uploading a photo. Uploading grants an
 * anonymous session, so landing here without one means starting over at home
 * rather than being asked to sign in.
 */
const ROOM_ROUTES = ["/rooms", "/room"];

/** Routes that genuinely need an account. */
const ACCOUNT_ROUTES = ["/explore", "/saved"];

const matchesRoute = (pathname: string, routes: readonly string[]) =>
  routes.some((route) => pathname.startsWith(route));

// THIS IS NOT SECURE!
// This is the recommended approach to optimistically redirect users
// We recommend handling auth checks in each page/route
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionKind = await getSessionKind();

  // Only people who already have an account have nothing to do here.
  // Anonymous visitors come to these pages precisely to get one.
  if (matchesRoute(pathname, AUTH_ROUTES)) {
    return sessionKind === "account"
      ? NextResponse.redirect(new URL("/rooms", request.url))
      : NextResponse.next();
  }

  if (sessionKind !== "none") {
    return NextResponse.next();
  }

  // An invite link is the one way into a room you have never opened. The page
  // signs the visitor in anonymously and redeems the token, so it goes through
  // rather than being sent home for having no session yet.
  if (request.nextUrl.searchParams.has("invite")) {
    return NextResponse.next();
  }

  // Without any session there is nothing to show here yet: start at home.
  if (matchesRoute(pathname, ROOM_ROUTES)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (matchesRoute(pathname, ACCOUNT_ROUTES)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

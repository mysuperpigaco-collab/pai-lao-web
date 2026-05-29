import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/trips/create",
  "/business/dashboard",
  "/business/edit-profile",
  "/business/places",
  "/admin",
  "/planner",
];

const AUTH_ROUTES = ["/login", "/signup"];
const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];

function getHomeForRole(role: string) {
  if (ADMIN_ROLES.includes(role)) return "/admin";
  if (role === "BUSINESS") return "/business/dashboard";
  return "/dashboard";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("pl_token")?.value;
  const session = token ? await verifyToken(token) : null;

  // Protected routes require login
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged-in users redirected away from auth pages
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL(getHomeForRole(session.role), request.url));
  }

  // ADMIN/SUPERADMIN cannot create trips
  if (pathname.startsWith("/trips/create") && session && ADMIN_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // ADMIN/SUPERADMIN cannot access user dashboard
  if (pathname.startsWith("/dashboard") && session && ADMIN_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Non-admin users cannot access /admin
  if (pathname.startsWith("/admin") && session && !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL(getHomeForRole(session.role), request.url));
  }

  // Traveler cannot access business routes
  if (pathname.startsWith("/business") && session?.role === "TRAVELER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trips/create",
    "/business/:path*",
    "/admin/:path*",
    "/planner/:path*",
    "/login",
    "/signup",
  ],
};

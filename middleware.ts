import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// Route ที่ต้อง login ก่อนเข้า
const PROTECTED_ROUTES = [
  "/dashboard",
  "/trips/create",
  "/business/dashboard",
  "/business/edit-profile",
  "/business/places",
];

// Route ที่ถ้า login แล้วไม่ควรเข้า (redirect ออก)
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ดึง token จาก cookie
  const token = request.cookies.get("pl_token")?.value;
  const session = token ? await verifyToken(token) : null;

  // ── ถ้าเป็น protected route แต่ยังไม่ login ──────────────
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── ถ้า login แล้วพยายามเข้า /login หรือ /signup ──────────
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && session) {
    const redirectTo =
      session.role === "BUSINESS" ? "/business/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // ── ป้องกัน Business route จาก Traveler ──────────────────
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
    "/login",
    "/signup",
  ],
};

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// GET /api/auth/google — เริ่ม flow: ตั้ง state กัน CSRF แล้วส่งไปหน้า consent ของ Google
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?error=google_config", request.url));
  }

  // redirect_uri ต้องตรงกับที่ลงทะเบียนใน Google Cloud เป๊ะ ๆ
  const base = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const redirectUri = `${base}/api/auth/google/callback`;

  const state = crypto.randomBytes(16).toString("hex");
  // intent: สมัคร/เข้าสู่ระบบในนามนักรีวิว (user) หรือเจ้าของสถานที่ (business)
  const intent = request.nextUrl.searchParams.get("intent") === "business" ? "business" : "user";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  // เก็บ state ไว้ตรวจตอน callback (อายุ 10 นาที, lax เพื่อให้รอดข้าม redirect กลับ)
  res.cookies.set("pl_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("pl_oauth_intent", intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

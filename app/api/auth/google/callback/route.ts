import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, isProfileComplete } from "@/lib/auth";

const COOKIE_NAME = "pl_token";

// สร้าง username ไม่ซ้ำจากอีเมล
async function uniqueUsername(email: string): Promise<string> {
  let base = (email.split("@")[0] || "user").replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  if (base.length < 3) base = `user${base}`;
  base = base.slice(0, 24);
  let candidate = base;
  for (let i = 0; i < 50; i++) {
    const exists = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!exists) return candidate;
    candidate = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}${Date.now()}`;
}

function redirectWithError(request: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin));
}

// GET /api/auth/google/callback — รับ code จาก Google แล้วล็อกอิน/สมัครให้
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return redirectWithError(request, "google_config");

  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const savedState = request.cookies.get("pl_oauth_state")?.value;
  // intent ที่ผู้ใช้เลือกจากแท็บ (นักรีวิว/เจ้าของสถานที่) — ใช้เฉพาะตอนสร้างบัญชีใหม่
  const intent = request.cookies.get("pl_oauth_intent")?.value === "business" ? "business" : "user";

  // ตรวจ state กัน CSRF
  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithError(request, "google_state");
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const redirectUri = `${base}/api/auth/google/callback`;

  try {
    // 1) แลก code เป็น token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const token = await tokenRes.json();
    if (!tokenRes.ok || !token.access_token) {
      console.error("Google token exchange failed:", token);
      return redirectWithError(request, "google_token");
    }

    // 2) ดึงข้อมูลโปรไฟล์
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const info = await infoRes.json();
    const googleId: string | undefined = info.sub;
    const email: string | undefined = info.email?.toLowerCase();
    if (!infoRes.ok || !googleId || !email) {
      console.error("Google userinfo failed:", info);
      return redirectWithError(request, "google_userinfo");
    }
    if (info.email_verified === false) {
      return redirectWithError(request, "google_unverified");
    }

    // 3) หา/สร้าง/ลิงก์ผู้ใช้
    const userSelect = {
      id: true, username: true, role: true, bannedUntil: true, googleId: true, avatarUrl: true,
      authProvider: true, phone: true, gender: true,
      business: { select: { businessName: true, phone: true } },
    } as const;

    let isNew = false;
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      select: userSelect,
    });

    if (user) {
      // มีบัญชีอยู่แล้ว (เจอจาก googleId หรืออีเมลเดิม) → ลิงก์ Google + ตั้งยืนยันอีเมล
      // หมายเหตุ: ใช้ role เดิมของผู้ใช้เสมอ — intent (แท็บ) ไม่เปลี่ยน role บัญชีที่มีอยู่แล้ว
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            emailVerified: true,
            avatarUrl: user.avatarUrl || info.picture || null,
          },
        });
      }
    } else {
      isNew = true;
      const username = await uniqueUsername(email);
      const fullName = [info.given_name, info.family_name].filter(Boolean).join(" ") || info.name || "ผู้ใช้";
      user = await prisma.user.create({
        data: {
          firstName: info.given_name || info.name || "ผู้ใช้",
          lastName: info.family_name || "",
          displayName: fullName, // prefill ชื่อที่แสดงจาก Google
          username,
          email,
          googleId,
          authProvider: "GOOGLE",
          emailVerified: true,
          avatarUrl: info.picture || null,
          role: intent === "business" ? "BUSINESS" : "TRAVELER",
          // เจ้าของสถานที่: สร้าง Business record รอกรอกข้อมูล (businessName ว่าง = ยังไม่ครบ → ต้อง onboarding)
          ...(intent === "business" && {
            business: {
              create: {
                businessName: "",
                contactName: fullName,
                email,
              },
            },
          }),
        },
        select: userSelect,
      });
    }

    // 4) เช็คแบน
    if (user.bannedUntil && user.bannedUntil > new Date()) {
      return redirectWithError(request, "banned");
    }

    // 5) เช็คว่าข้อมูลจำเป็นครบไหม (onb) → ออก JWT พร้อมสถานะ
    const onb = isProfileComplete({
      authProvider: user.authProvider,
      phone: user.phone,
      gender: user.gender,
      role: user.role,
      business: user.business,
    });

    const tokenJwt = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role as any,
      onb,
    });

    // ยังกรอกไม่ครบ → พาไปหน้า onboarding ตามประเภท · ครบแล้ว → เข้าตามบทบาท
    const dest = !onb
      ? (user.role === "BUSINESS" ? "/business/edit-profile?welcome=google" : "/dashboard/edit-profile?welcome=google")
      : user.role === "SUPERADMIN" || user.role === "ADMIN" ? "/admin"
      : user.role === "BUSINESS" ? "/business/dashboard"
      : "/dashboard";

    const res = NextResponse.redirect(new URL(dest, base));
    res.cookies.set(COOKIE_NAME, tokenJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.delete("pl_oauth_state");
    res.cookies.delete("pl_oauth_intent");
    return res;
  } catch (err) {
    console.error("Google callback error:", err);
    return redirectWithError(request, "google_error");
  }
}

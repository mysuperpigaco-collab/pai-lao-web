import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// ── Config ───────────────────────────────────────────────────

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is not set. Set it before deploying.");
  }
  console.warn("[auth] JWT_SECRET not set — using insecure dev fallback. DO NOT use in production.");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pai-lao-dev-secret-do-not-use-in-production"
);
const COOKIE_NAME = "pl_token";
const TOKEN_EXPIRES = "7d"; // 7 วัน

// ── Password ─────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT ──────────────────────────────────────────────────────

export type JWTPayload = {
  userId: string;
  username: string;
  role: "TRAVELER" | "BUSINESS" | "ADMIN" | "SUPERADMIN";
  onb?: boolean; // onboarded — ข้อมูลจำเป็นครบแล้วหรือยัง (undefined = ถือว่าครบ, สำหรับ token เก่า)
};

// ── ตรวจว่าข้อมูลโปรไฟล์จำเป็นครบไหม (ใช้ตัดสิน onb) ──────────
// บัญชีที่ไม่ใช่ Google ถือว่าครบเสมอ (กรอกครบตอนสมัครฟอร์มแล้ว) → ไม่โดน gate
const digits = (s?: string | null) => (s ?? "").replace(/[^0-9]/g, "");
const phoneOk = (s?: string | null) => {
  const d = digits(s);
  return d.length >= 9 && d.length <= 10;
};

export function isProfileComplete(u: {
  authProvider?: string | null;
  phone?: string | null;
  gender?: string | null;
  role?: string | null;
  business?: { businessName?: string | null; phone?: string | null } | null;
}): boolean {
  if (u.authProvider !== "GOOGLE") return true;
  if (u.role === "BUSINESS") {
    return !!u.business?.businessName?.trim() && phoneOk(u.business?.phone);
  }
  // TRAVELER (Google): ต้องมีเบอร์โทร (9-10 หลัก) + เพศ
  return phoneOk(u.phone) && !!u.gender;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRES)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน (วินาที)
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ── getCurrentUser — ใช้ใน Server Component / API Route ──────

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) return null;
  return verifyToken(token);
}

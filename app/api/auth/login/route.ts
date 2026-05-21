import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { emailOrUsername, password } = await request.json();

    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน" },
        { status: 400 }
      );
    }

    // ── หา User ด้วย email หรือ username ─────────────────────
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        password: true,
        bannedUntil: true,
        banReason: true,
        business: {
          select: { id: true, businessName: true, logoUrl: true, isVerified: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ไม่พบบัญชีนี้ในระบบ" },
        { status: 401 }
      );
    }

    // ── ตรวจรหัสผ่าน ──────────────────────────────────────────
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // ── เช็คว่าบัญชีถูกแบนอยู่หรือไม่ ──────────────────────────
    if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
      const until = new Date(user.bannedUntil);
      const isPermanent = until.getFullYear() >= 2099;
      const dateStr = isPermanent
        ? "ถาวร"
        : until.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
      return NextResponse.json({
        message: `บัญชีนี้ถูกระงับ${isPermanent ? "อย่างถาวร" : `ถึงวันที่ ${dateStr}`}${user.banReason ? ` เหตุผล: ${user.banReason}` : ""}`,
      }, { status: 403 });
    }

    // ── ออก JWT ───────────────────────────────────────────────
    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
    await setAuthCookie(token);

    // ── strip password, return full user ─────────────────────
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: safeUser,
    });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

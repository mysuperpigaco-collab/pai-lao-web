import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";

// ── helper: ดึง IP จาก request headers ──────────────────────
function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip        = getIp(request);
  const userAgent = request.headers.get("user-agent") || undefined;

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

    // ── ตรวจรหัสผ่าน (ใช้ message เดียวกัน ป้องกัน user enumeration) ─
    const isValid = user ? await verifyPassword(password, user.password) : false;
    if (!user || !isValid) {
      // บันทึก login ล้มเหลว
      await prisma.loginLog.create({
        data: {
          userId:    user?.id    ?? null,
          username:  user?.username ?? emailOrUsername.substring(0, 100),
          action:    "LOGIN_FAILED",
          ip,
          userAgent,
        },
      }).catch(() => {}); // ไม่ให้ log error ขัดขวาง response
      return NextResponse.json(
        { message: "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" },
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

    // ── บันทึก login สำเร็จ (พ.ร.บ. คอมพิวเตอร์ มาตรา 26) ──
    await prisma.loginLog.create({
      data: {
        userId:   user.id,
        username: user.username,
        action:   "LOGIN_SUCCESS",
        ip,
        userAgent,
      },
    }).catch(() => {});

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

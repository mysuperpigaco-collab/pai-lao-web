import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity, getClientIp } from "@/lib/activityLogger";
import { hashToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const ip        = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? null;

  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: { resetToken: hashToken(token), resetTokenExp: { gt: new Date() } },
    });

    if (!user) return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExp: null, emailVerified: true },
    });

    await logActivity({
      userId: user.id, username: user.username,
      action: "PASSWORD_RESET_SUCCESS",
      ip, userAgent,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

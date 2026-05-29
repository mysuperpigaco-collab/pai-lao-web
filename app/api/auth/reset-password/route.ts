import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) return NextResponse.json({ error: "ลิงก์หมดอายุหรือไม่ถูกต้อง" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

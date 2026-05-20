import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────
//  POST /api/admin/seed
//  สร้าง SUPERADMIN คนแรก — ใช้ได้ครั้งเดียวเท่านั้น
//  ต้องส่ง SEED_SECRET ใน header X-Seed-Secret
// ─────────────────────────────────────────────────────────────────

const SEED_SECRET = process.env.ADMIN_SEED_SECRET || "";

export async function POST(request: Request) {
  // Guard: ต้องตั้ง ADMIN_SEED_SECRET ใน env ก่อน
  if (!SEED_SECRET || SEED_SECRET.length < 12) {
    return NextResponse.json(
      { message: "ไม่ได้ตั้งค่า ADMIN_SEED_SECRET ใน environment variables" },
      { status: 503 }
    );
  }

  const secret = request.headers.get("x-seed-secret");
  if (secret !== SEED_SECRET) {
    return NextResponse.json({ message: "Secret ไม่ถูกต้อง" }, { status: 401 });
  }

  // ตรวจว่ามี SUPERADMIN อยู่แล้วหรือยัง
  const existing = await prisma.user.count({ where: { role: "SUPERADMIN" } });
  if (existing > 0) {
    return NextResponse.json(
      { message: `มี SUPERADMIN อยู่แล้ว ${existing} คน ไม่จำเป็นต้อง seed ซ้ำ` },
      { status: 409 }
    );
  }

  const body = await request.json();
  const { firstName, lastName, username, email, phone, password } = body;

  if (!firstName || !lastName || !username || !email || !phone || !password) {
    return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const [dupEmail, dupUser] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { username } }),
  ]);
  if (dupEmail) return NextResponse.json({ message: "อีเมลนี้ถูกใช้แล้ว" }, { status: 409 });
  if (dupUser)  return NextResponse.json({ message: "Username นี้ถูกใช้แล้ว" }, { status: 409 });

  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: { firstName, lastName, username, email, phone, password: hashed, role: "SUPERADMIN" },
    select: { id: true, username: true, email: true, role: true },
  });

  // Auto-login
  const token = await signToken({ userId: user.id, username: user.username, role: user.role });
  await setAuthCookie(token);

  return NextResponse.json({
    message: "✅ สร้าง SUPERADMIN สำเร็จ!",
    user,
  }, { status: 201 });
}

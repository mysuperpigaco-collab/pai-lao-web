import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/auth/me
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, firstName: true, lastName: true, username: true,
      email: true, displayName: true, avatarUrl: true, coverUrl: true,
      bio: true, phone: true, gender: true, birthDate: true,
      lineId: true, facebook: true, instagram: true, tiktok: true,
      role: true,
      profilePrivacy: true, showEmail: true, showPhone: true,
      showSocial: true, showBirthDate: true,
      business: {
        select: { id: true, businessName: true, logoUrl: true, isVerified: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT /api/auth/me
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const body = await request.json();
  const {
    firstName, lastName, displayName, phone, gender, bio,
    lineId, facebook, instagram, tiktok,
    avatarUrl, coverUrl,
    currentPw, newPw,
    profilePrivacy, showEmail, showPhone, showSocial, showBirthDate,
  } = body;

  if (newPw) {
    if (!currentPw) return NextResponse.json({ message: "กรุณากรอกรหัสผ่านปัจจุบัน" }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    const ok = await verifyPassword(currentPw, user.password);
    if (!ok) return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(firstName   !== undefined && { firstName }),
      ...(lastName    !== undefined && { lastName }),
      ...(displayName !== undefined && { displayName }),
      ...(phone       !== undefined && { phone }),
      ...(gender      !== undefined && { gender: gender ? gender.toUpperCase() as any : null }),
      ...(bio         !== undefined && { bio }),
      ...(lineId      !== undefined && { lineId }),
      ...(facebook    !== undefined && { facebook }),
      ...(instagram   !== undefined && { instagram }),
      ...(tiktok      !== undefined && { tiktok }),
      ...(avatarUrl      !== undefined && { avatarUrl }),
      ...(coverUrl       !== undefined && { coverUrl }),
      ...(newPw          ? { password: await hashPassword(newPw) } : {}),
      ...(profilePrivacy !== undefined && { profilePrivacy }),
      ...(showEmail      !== undefined && { showEmail: Boolean(showEmail) }),
      ...(showPhone      !== undefined && { showPhone: Boolean(showPhone) }),
      ...(showSocial     !== undefined && { showSocial: Boolean(showSocial) }),
      ...(showBirthDate  !== undefined && { showBirthDate: Boolean(showBirthDate) }),
    },
    select: {
      id: true, firstName: true, lastName: true, username: true,
      email: true, displayName: true, phone: true, gender: true, birthDate: true,
      bio: true, lineId: true, facebook: true, instagram: true, tiktok: true,
      avatarUrl: true, coverUrl: true,
      profilePrivacy: true, showEmail: true, showPhone: true,
      showSocial: true, showBirthDate: true,
    },
  });

  return NextResponse.json({ message: "อัปเดตสำเร็จ", user: updated });
}

import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword, signToken, setAuthCookie, isProfileComplete } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/auth/me
export async function GET() {
  try {
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
        role: true, tripGalleryLimit: true,
        profilePrivacy: true, showEmail: true, showPhone: true,
        showSocial: true, showBirthDate: true,
        authProvider: true, password: true,
        business: {
          select: { id: true, businessName: true, logoUrl: true, isVerified: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // ไม่ส่ง hash ออกไป — ส่งแค่ว่ามีรหัสผ่านแล้วหรือยัง
    const { password, ...safe } = user;
    return NextResponse.json({ user: { ...safe, hasPassword: !!password } });
  } catch (error) {
    console.error("GET /api/auth/me:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/auth/me
export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const body = await request.json();
    const {
      firstName, lastName, displayName, phone, gender, bio,
      lineId, facebook, instagram, tiktok,
      avatarUrl, coverUrl,
      username, currentPw, newPw,
      profilePrivacy, showEmail, showPhone, showSocial, showBirthDate,
    } = body;

    // ── เปลี่ยน username (เช็ครูปแบบ + ซ้ำ) ──────────────────────
    let newUsername: string | undefined;
    if (username !== undefined) {
      const uname = String(username).trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(uname)) {
        return NextResponse.json({ message: "ชื่อผู้ใช้ต้องเป็นภาษาอังกฤษ ตัวเลข หรือ _ (3-30 ตัว)" }, { status: 400 });
      }
      const taken = await prisma.user.findFirst({
        where: { username: { equals: uname, mode: "insensitive" }, NOT: { id: session.userId } },
        select: { id: true },
      });
      if (taken) return NextResponse.json({ message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 400 });
      newUsername = uname;
    }

    if (newPw) {
      if (newPw.length < 8) return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
      if (!/[a-zA-Z]/.test(newPw)) return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีตัวอักษรอย่างน้อย 1 ตัว" }, { status: 400 });
      if (!/[0-9]/.test(newPw)) return NextResponse.json({ message: "รหัสผ่านใหม่ต้องมีตัวเลขอย่างน้อย 1 ตัว" }, { status: 400 });
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } });
      if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
      // มีรหัสผ่านอยู่แล้ว → ต้องยืนยันรหัสเดิม · ยังไม่มี (บัญชี Google) → ตั้งใหม่ได้เลย
      if (user.password) {
        if (!currentPw) return NextResponse.json({ message: "กรุณากรอกรหัสผ่านปัจจุบัน" }, { status: 400 });
        const ok = await verifyPassword(currentPw, user.password);
        if (!ok) return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
      }
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
        ...(newUsername    !== undefined && { username: newUsername }),
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

    // ── ออก token ใหม่พร้อมสถานะ onboarding (กันข้าม onboarding) ──
    const fresh = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        role: true, authProvider: true, phone: true, gender: true,
        business: { select: { businessName: true, phone: true } },
      },
    });
    const onb = isProfileComplete({
      authProvider: fresh?.authProvider,
      phone: fresh?.phone,
      gender: fresh?.gender,
      role: fresh?.role,
      business: fresh?.business,
    });
    const token = await signToken({
      userId: session.userId,
      username: updated.username,
      role: (fresh?.role ?? session.role) as any,
      onb,
    });
    await setAuthCookie(token);

    return NextResponse.json({ message: "อัปเดตสำเร็จ", user: updated, onboarded: onb });
  } catch (error) {
    console.error("PUT /api/auth/me:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

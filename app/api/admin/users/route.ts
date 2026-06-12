import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function banUntilDate(duration: string): Date {
  const now = new Date();
  if (duration === "1d")  return new Date(now.getTime() + 1  * 24 * 60 * 60 * 1000);
  if (duration === "7d")  return new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000);
  if (duration === "30d") return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return new Date("2099-12-31T23:59:59Z"); // permanent
}

// GET /api/admin/users?q=&role=&page=&limit=&banned=1
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q      = searchParams.get("q") || "";
    const role   = searchParams.get("role") || "";
    const banned = searchParams.get("banned") === "1";
    const page   = parseInt(searchParams.get("page") || "1");
    const limit  = parseInt(searchParams.get("limit") || "20");
    const skip   = (page - 1) * limit;

    const conditions: any[] = [];
    if (q) {
      conditions.push({ OR: [
        { username:    { contains: q, mode: "insensitive" } },
        { email:       { contains: q, mode: "insensitive" } },
        { firstName:   { contains: q, mode: "insensitive" } },
        { lastName:    { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ]});
    }
    if (role) conditions.push({ role });
    if (banned) {
      const now = new Date();
      conditions.push({ OR: [
        { bannedUntil:     { gt: now } },
        { postBannedUntil: { gt: now } },
      ]});
    }

    const where: any = conditions.length > 1
      ? { AND: conditions }
      : conditions[0] ?? {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, username: true, email: true, firstName: true, lastName: true,
          displayName: true, avatarUrl: true, role: true, phone: true, createdAt: true,
          bannedUntil: true, postBannedUntil: true, banReason: true, tripGalleryLimit: true,
          _count: { select: { trips: true, reviews: true, reports: true } },
          business: { select: { businessName: true, isVerified: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/admin/users:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/admin/users — change role, ban, or unban
export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, action, duration, reason } = body;
    if (!userId) return NextResponse.json({ message: "กรุณาระบุ userId" }, { status: 400 });

    // Only SUPERADMIN can promote to ADMIN/SUPERADMIN
    if ((role === "ADMIN" || role === "SUPERADMIN") && session.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
    }

    // changeRole
    const validRoles = ["TRAVELER", "BUSINESS", "ADMIN", "SUPERADMIN"];
    if (action === "changeRole" && role && validRoles.includes(role)) {
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        select: { id: true, username: true, role: true },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "CHANGE_ROLE", targetId: userId, targetType: "USER", detail: `Changed role to ${role}` },
      });
      return NextResponse.json({ message: "เปลี่ยน role สำเร็จ", user: updated });
    }

    // banAccount — ระงับบัญชี (login ไม่ได้)
    if (action === "banAccount") {
      if (!duration) return NextResponse.json({ message: "กรุณาระบุระยะเวลาแบน" }, { status: 400 });
      if (!reason?.trim()) return NextResponse.json({ message: "กรุณาระบุเหตุผล" }, { status: 400 });
      const until = banUntilDate(duration);
      await prisma.user.update({
        where: { id: userId },
        data: { bannedUntil: until, banReason: reason.trim() },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "BAN_USER", targetId: userId, targetType: "USER",
          detail: `banAccount duration:${duration} reason:${reason.trim()}` },
      });
      return NextResponse.json({ message: "แบนบัญชีสำเร็จ" });
    }

    // banPost — ห้ามโพส (login ได้แต่สร้าง content ไม่ได้)
    if (action === "banPost") {
      if (!duration) return NextResponse.json({ message: "กรุณาระบุระยะเวลาแบน" }, { status: 400 });
      if (!reason?.trim()) return NextResponse.json({ message: "กรุณาระบุเหตุผล" }, { status: 400 });
      const until = banUntilDate(duration);
      await prisma.user.update({
        where: { id: userId },
        data: { postBannedUntil: until, banReason: reason.trim() },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "BAN_USER", targetId: userId, targetType: "USER",
          detail: `banPost duration:${duration} reason:${reason.trim()}` },
      });
      return NextResponse.json({ message: "ห้ามโพสสำเร็จ" });
    }

    // unban — ยกเลิกแบนทุกประเภท
    if (action === "unban") {
      await prisma.user.update({
        where: { id: userId },
        data: { bannedUntil: null, postBannedUntil: null, banReason: null },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "BAN_USER", targetId: userId, targetType: "USER", detail: "unban" },
      });
      return NextResponse.json({ message: "ยกเลิกแบนสำเร็จ" });
    }

    // setGalleryLimit — ตั้งจำนวนรูป gallery สูงสุดต่อทริป
    if (action === "setGalleryLimit") {
      const { limit } = body;
      const VALID = [50, 100, 150, 200];
      if (!VALID.includes(limit)) return NextResponse.json({ message: "ค่าที่อนุญาต: 50, 100, 150, 200" }, { status: 400 });
      await prisma.user.update({
        where: { id: userId },
        data: { tripGalleryLimit: limit },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "CHANGE_ROLE", targetId: userId, targetType: "USER",
          detail: `setGalleryLimit: ${limit}` },
      });
      return NextResponse.json({ message: `ตั้งค่า gallery limit เป็น ${limit} รูปสำเร็จ` });
    }

    return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/admin/users:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

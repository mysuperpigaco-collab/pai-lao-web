import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users?q=&role=&page=&limit=
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q     = searchParams.get("q") || "";
    const role  = searchParams.get("role") || "";
    const page  = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip  = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.OR = [
        { username:    { contains: q, mode: "insensitive" } },
        { email:       { contains: q, mode: "insensitive" } },
        { firstName:   { contains: q, mode: "insensitive" } },
        { lastName:    { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, username: true, email: true, firstName: true, lastName: true,
          displayName: true, avatarUrl: true, role: true, phone: true, createdAt: true,
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

// PUT /api/admin/users — change role or ban
export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { userId, role, action } = await request.json();
    if (!userId) return NextResponse.json({ message: "กรุณาระบุ userId" }, { status: 400 });

    // Only SUPERADMIN can promote to ADMIN/SUPERADMIN
    if ((role === "ADMIN" || role === "SUPERADMIN") && session.role !== "SUPERADMIN") {
      return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
    }

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

    return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/admin/users:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

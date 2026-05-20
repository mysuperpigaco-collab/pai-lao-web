import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/permissions — list admins (SUPERADMIN only)
export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
  }

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, username: true, email: true, displayName: true,
      firstName: true, lastName: true, avatarUrl: true, role: true, createdAt: true,
    },
  });

  return NextResponse.json({ admins });
}

// PUT /api/admin/permissions — change role (SUPERADMIN only)
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
  }

  const { userId, role } = await request.json();
  if (!userId || !role) return NextResponse.json({ message: "กรุณาระบุ userId และ role" }, { status: 400 });

  const validRoles = ["TRAVELER", "BUSINESS", "ADMIN", "SUPERADMIN"];
  if (!validRoles.includes(role)) return NextResponse.json({ message: "role ไม่ถูกต้อง" }, { status: 400 });

  // Prevent removing own SUPERADMIN
  if (userId === session.userId && role !== "SUPERADMIN") {
    return NextResponse.json({ message: "ไม่สามารถลดสิทธิ์ตัวเองได้" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
    select: { id: true, username: true, role: true },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.userId,
      action: "CHANGE_ROLE",
      targetId: userId,
      targetType: "USER",
      detail: `Changed role to ${role}`,
    },
  });

  return NextResponse.json({ message: "เปลี่ยนสิทธิ์สำเร็จ", user: updated });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/announcements
export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const announcements = await (prisma as any).announcement.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { username: true, displayName: true } } },
  });

  return NextResponse.json({ announcements });
}

// POST /api/admin/announcements
export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { title, body, icon, type, targetRole, expiresAt } = await request.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ message: "กรุณากรอกหัวข้อและเนื้อหา" }, { status: 400 });
  }

  const announcement = await (prisma as any).announcement.create({
    data: {
      title:      title.trim(),
      body:       body.trim(),
      icon:       icon       || "📢",
      type:       type       || "info",
      targetRole: targetRole || null,
      expiresAt:  expiresAt  ? new Date(expiresAt) : null,
      createdById: session.userId,
    },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.userId, action: "CREATE_ANNOUNCEMENT",
      targetId: announcement.id, targetType: "ANNOUNCEMENT",
      detail: announcement.title,
    },
  });

  return NextResponse.json({ message: "สร้างประกาศสำเร็จ", announcement }, { status: 201 });
}

// DELETE /api/admin/announcements
export async function DELETE(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) return NextResponse.json({ message: "กรุณาระบุ id" }, { status: 400 });

  await (prisma as any).announcement.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "ปิดประกาศแล้ว" });
}

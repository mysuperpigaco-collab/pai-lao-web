import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/reports — รายงานเนื้อหา
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { targetId, targetType, reason, detail } = await request.json();
    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    // prevent duplicate report by same user on same target
    const existing = await prisma.report.findFirst({
      where: { reporterId: session.userId, targetId },
    });
    if (existing) {
      return NextResponse.json({ message: "คุณรายงานเนื้อหานี้แล้ว", alreadyReported: true }, { status: 409 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.userId,
        targetId,
        targetType,
        reason,
        detail: detail ?? null,
      },
    });

    return NextResponse.json({ message: "ส่งรายงานสำเร็จ", report }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reports:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

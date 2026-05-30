import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/missions/[id]/join
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      return NextResponse.json({ error: "แอดมินไม่สามารถรับภารกิจได้" }, { status: 403 });
    }

    const { id } = await params;
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });
    if (!mission) return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 404 });
    if (mission.status !== "ACTIVE" || mission.endDate < new Date()) {
      return NextResponse.json({ error: "ภารกิจนี้หมดอายุแล้ว" }, { status: 400 });
    }
    if (mission.maxSlots && mission._count.participants >= mission.maxSlots) {
      return NextResponse.json({ error: "ภารกิจนี้เต็มแล้ว" }, { status: 400 });
    }

    const existing = await prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId: id, userId: session.userId } },
    });
    if (existing) return NextResponse.json({ error: "คุณรับภารกิจนี้ไปแล้ว" }, { status: 409 });

    const participant = await prisma.missionParticipant.create({
      data: { missionId: id, userId: session.userId },
    });
    return NextResponse.json({ ok: true, participant }, { status: 201 });
  } catch (e) {
    console.error("POST /api/missions/[id]/join:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

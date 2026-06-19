import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/missions/[id]/submit — ส่งผลงานโดยตรง (ไม่ต้อง join ก่อน)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      return NextResponse.json({ error: "แอดมินไม่สามารถส่งผลงานได้" }, { status: 403 });
    }

    const { id } = await params;
    const { photoUrls, reviewText, placeId } = await req.json();

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    const mission = await prisma.mission.findUnique({ where: { id } });
    if (!mission) return NextResponse.json({ error: "ไม่พบภารกิจ" }, { status: 404 });
    if (mission.status !== "ACTIVE" || mission.endDate < new Date()) {
      return NextResponse.json({ error: "ภารกิจนี้หมดอายุแล้ว" }, { status: 400 });
    }

    // Check if already submitted/approved — prevent re-submit
    const existing = await prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId: id, userId: session.userId } },
    });
    if (existing && (existing.status === "SUBMITTED" || existing.status === "APPROVED")) {
      return NextResponse.json({ error: "คุณส่งผลงานไปแล้ว" }, { status: 409 });
    }

    // Check maxSlots — reject if mission is full
    if (mission.maxSlots != null) {
      const filled = await prisma.missionParticipant.count({
        where: { missionId: id, status: { in: ["SUBMITTED", "APPROVED"] } },
      });
      if (filled >= mission.maxSlots) {
        return NextResponse.json({ error: "ภารกิจนี้เต็มแล้ว" }, { status: 409 });
      }
    }

    // Upsert: create or update to SUBMITTED
    const participant = await prisma.missionParticipant.upsert({
      where: { missionId_userId: { missionId: id, userId: session.userId } },
      create: {
        missionId: id,
        userId: session.userId,
        status: "SUBMITTED",
        photoUrls,
        reviewText: reviewText || null,
        placeId: placeId || null,
        visitedAt: new Date(),
        submittedAt: new Date(),
      },
      update: {
        status: "SUBMITTED",
        photoUrls,
        reviewText: reviewText || null,
        placeId: placeId || null,
        visitedAt: new Date(),
        submittedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, participant });
  } catch (e) {
    console.error("POST /api/missions/[id]/submit:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

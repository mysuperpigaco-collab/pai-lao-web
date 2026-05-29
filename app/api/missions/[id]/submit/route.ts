import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/missions/[id]/submit — ส่งผลงาน
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { id } = await params;
    const { photoUrls, reviewText, placeId } = await req.json();

    if (!photoUrls || photoUrls.length === 0) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป" }, { status: 400 });
    }

    const participant = await prisma.missionParticipant.findUnique({
      where: { missionId_userId: { missionId: id, userId: session.userId } },
    });
    if (!participant) return NextResponse.json({ error: "คุณยังไม่ได้รับภารกิจนี้" }, { status: 404 });
    if (participant.status !== "JOINED") {
      return NextResponse.json({ error: "ส่งผลงานไปแล้ว" }, { status: 409 });
    }

    const updated = await prisma.missionParticipant.update({
      where: { missionId_userId: { missionId: id, userId: session.userId } },
      data: {
        status: "SUBMITTED",
        photoUrls,
        reviewText: reviewText || null,
        placeId: placeId || null,
        submittedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, participant: updated });
  } catch (e) {
    console.error("POST /api/missions/[id]/submit:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

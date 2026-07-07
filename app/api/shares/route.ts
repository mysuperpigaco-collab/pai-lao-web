import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // ต้อง login ก่อนถึงจะ share ได้
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    // Rate limit: กันปั่น shareCount (เข้า trending score) — 30/นาที ต่อ user
    const rl = await checkRateLimit(`share:${session.userId}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "แชร์บ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const body = await req.json();
    const { tripId, placeId } = body as { tripId?: string; placeId?: string };

    if (!tripId && !placeId) {
      return NextResponse.json({ error: "tripId or placeId required" }, { status: 400 });
    }

    if (tripId) {
      // increment เฉพาะทริปที่อนุมัติแล้ว (กันปั่นของที่ยังไม่ public)
      const updated = await prisma.trip.updateMany({
        where: { id: tripId, isPublished: true, approvalStatus: "APPROVED" },
        data: { shareCount: { increment: 1 } },
      });
      if (updated.count === 0) return NextResponse.json({ error: "ไม่พบทริป" }, { status: 404 });
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { shareCount: true } });
      return NextResponse.json({ shareCount: trip?.shareCount ?? 0 });
    }

    if (placeId) {
      const updated = await prisma.place.updateMany({
        where: { id: placeId, approvalStatus: "APPROVED" },
        data: { shareCount: { increment: 1 } },
      });
      if (updated.count === 0) return NextResponse.json({ error: "ไม่พบสถานที่" }, { status: 404 });
      const place = await prisma.place.findUnique({ where: { id: placeId }, select: { shareCount: true } });
      return NextResponse.json({ shareCount: place?.shareCount ?? 0 });
    }
  } catch (e) {
    console.error("POST /api/shares:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

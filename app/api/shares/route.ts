import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // ต้อง login ก่อนถึงจะ share ได้
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const body = await req.json();
    const { tripId, placeId } = body as { tripId?: string; placeId?: string };

    if (!tripId && !placeId) {
      return NextResponse.json({ error: "tripId or placeId required" }, { status: 400 });
    }

    if (tripId) {
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });
      return NextResponse.json({ shareCount: updated.shareCount });
    }

    if (placeId) {
      const updated = await prisma.place.update({
        where: { id: placeId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      });
      return NextResponse.json({ shareCount: updated.shareCount });
    }
  } catch (e) {
    console.error("POST /api/shares:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

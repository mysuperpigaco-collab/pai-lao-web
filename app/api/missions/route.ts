import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/missions — list active missions
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";

    // Use start of today (UTC) so missions expiring today still appear during the day
    const now = new Date();
    const startOfToday = new Date(now.toISOString().slice(0, 10) + "T00:00:00.000Z");
    const missions = await prisma.mission.findMany({
      where: {
        status,
        ...(status === "ACTIVE" ? { endDate: { gte: startOfToday } } : {}),
      },
      include: {
        place: { select: { id: true, title: true, slug: true, coverUrl: true, province: true } },
        _count: { select: { participants: true } },
        participants: session
          ? { where: { userId: session.userId }, select: { status: true } }
          : false,
      },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json({ missions });
  } catch (e) {
    console.error("GET /api/missions:", e);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

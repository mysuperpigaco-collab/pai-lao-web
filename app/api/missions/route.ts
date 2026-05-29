import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/missions — list active missions
export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ACTIVE";

    const now = new Date();
    const missions = await prisma.mission.findMany({
      where: {
        status,
        ...(status === "ACTIVE" ? { endDate: { gt: now } } : {}),
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

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/announcements — ดึงประกาศที่ active สำหรับ user ที่ login
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ announcements: [] });

    const now = new Date();
    const announcements = await (prisma as any).announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
          { OR: [{ targetRole: null }, { targetRole: session.role }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, body: true, icon: true, type: true, createdAt: true },
    });

    return NextResponse.json({ announcements });
  } catch (err) {
    console.error("GET /api/announcements:", err);
    return NextResponse.json({ announcements: [] });
  }
}

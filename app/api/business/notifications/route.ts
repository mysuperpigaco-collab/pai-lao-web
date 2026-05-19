import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── GET /api/business/notifications — รีวิวล่าสุดบนสถานที่ของเจ้าของธุรกิจ ──
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!business) return NextResponse.json({ notifications: [] });

    // Get the last 15 reviews on this business's places
    const reviews = await prisma.review.findMany({
      where: {
        place: { businessId: business.id },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        author: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
        place:  { select: { id: true, slug: true, title: true, coverUrl: true } },
        replies: { select: { id: true } },
      },
    });

    return NextResponse.json({ notifications: reviews });
  } catch (error) {
    console.error("GET /api/business/notifications:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

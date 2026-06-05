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
      where: { place: { businessId: business.id } },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        author: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
        place:  { select: { id: true, slug: true, title: true, coverUrl: true } },
        replies: { select: { id: true } },
      },
    });

    // Get rejected edits for this business's places (แจ้งเตือนการแก้ไขถูกปฏิเสธ)
    const businessPlaces = await prisma.place.findMany({
      where: { businessId: business.id },
      select: { id: true, slug: true, title: true, coverUrl: true },
    });
    const placeMap = Object.fromEntries(businessPlaces.map(p => [p.id, p]));
    const placeIds = businessPlaces.map(p => p.id);

    const rejectedEdits = placeIds.length > 0
      ? await (prisma as any).pendingEdit.findMany({
          where: { targetType: "PLACE", targetId: { in: placeIds }, status: "REJECTED" },
          select: { id: true, targetId: true, rejectionReason: true, updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 10,
        })
      : [];

    const editNotifications = rejectedEdits.map((e: any) => ({
      id: `edit-${e.id}`,
      type: "EDIT_REJECTED" as const,
      place: placeMap[e.targetId] ?? null,
      rejectionReason: e.rejectionReason ?? "ไม่ผ่านเกณฑ์",
      createdAt: e.updatedAt,
    })).filter((n: any) => n.place !== null);

    return NextResponse.json({ notifications: reviews, editNotifications });
  } catch (error) {
    console.error("GET /api/business/notifications:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

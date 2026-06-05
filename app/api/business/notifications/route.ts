import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PAGE_SIZE = 5;

// ── GET /api/business/notifications?skip=0 ──
export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const skip  = Math.max(0, parseInt(searchParams.get("skip") ?? "0"));

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!business) return NextResponse.json({ notifications: [], total: 0, unreadCount: 0, editNotifications: [] });

    const where = { place: { businessId: business.id } };

    // ดึง reviews + total + unreadCount พร้อมกัน
    const [reviews, total, unreadCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          author: { select: { id: true, firstName: true, displayName: true, avatarUrl: true } },
          place:  { select: { id: true, slug: true, title: true, coverUrl: true } },
          replies: { select: { id: true } },
        },
      }),
      prisma.review.count({ where }),
      // นับรีวิวที่ยังไม่มีการตอบกลับทั้งหมด (ไม่ใช่แค่หน้าแรก)
      prisma.review.count({ where: { ...where, replies: { none: {} } } }),
    ]);

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

    return NextResponse.json({
      notifications: reviews,
      total,
      unreadCount,
      hasMore: skip + PAGE_SIZE < total,
      editNotifications,
    });
  } catch (error) {
    console.error("GET /api/business/notifications:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

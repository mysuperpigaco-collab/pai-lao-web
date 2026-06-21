import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/reviews/notifications
// ส่งกลับ 2 ชุด:
//  1. reviews     — รีวิวที่ user เขียน และมีคนตอบกลับ (reply notifications)
//  2. tripReviews — รีวิวที่คนอื่นเขียนบนทริปของ user (trip-owner notifications)
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const [myReviews, tripReviews, rejectedStops] = await Promise.all([
      // รีวิวของ user ที่มีคนตอบกลับ
      prisma.review.findMany({
        where: { authorId: session.userId, replies: { some: {} } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, text: true, createdAt: true,
          place: { select: { slug: true, title: true } },
          trip:  { select: { slug: true, title: true } },
          replies: {
            orderBy: { createdAt: "desc" }, take: 5,
            select: {
              id: true, text: true, createdAt: true,
              author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true, role: true } },
            },
          },
        },
      }),

      // รีวิวที่คนอื่นเขียนบนทริปของ user
      prisma.review.findMany({
        where: {
          authorId: { not: session.userId },
          trip: { authorId: session.userId },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, text: true, rating: true, createdAt: true,
          trip: { select: { slug: true, title: true } },
          author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
          replies: { where: { authorId: session.userId }, take: 1, select: { id: true } },
        },
      }),

      // สถานที่ในทริปของ user ที่ถูกแอดมินปฏิเสธ (รอเจ้าของแก้ไข)
      prisma.timelineStop.findMany({
        where: {
          trip: { authorId: session.userId },
          place: { approvalStatus: "REJECTED" },
        },
        orderBy: { order: "asc" },
        select: {
          placeName: true,
          place: { select: { title: true, rejectionReason: true } },
          trip:  { select: { slug: true, title: true } },
        },
      }),
    ]);

    // จัดกลุ่มสถานที่ถูกปฏิเสธตามทริป
    const rejMap = new Map<string, { slug: string; title: string; count: number; places: { name: string; reason: string | null }[] }>();
    for (const s of rejectedStops as any[]) {
      if (!s.trip) continue;
      const key = s.trip.slug;
      if (!rejMap.has(key)) rejMap.set(key, { slug: s.trip.slug, title: s.trip.title, count: 0, places: [] });
      const entry = rejMap.get(key)!;
      entry.count += 1;
      entry.places.push({ name: s.place?.title || s.placeName || "สถานที่", reason: s.place?.rejectionReason ?? null });
    }
    const rejectedPlaceTrips = Array.from(rejMap.values());

    return NextResponse.json({ reviews: myReviews, tripReviews, rejectedPlaceTrips });
  } catch (err) {
    console.error("GET /api/reviews/notifications:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";

// สร้างรีวิวบนหน้า "สถานที่" จากจุดแวะที่เปิด shareToPlace ของทริปหนึ่ง
// เงื่อนไข: ทริปต้องอนุมัติ+เผยแพร่แล้ว และสถานที่ต้องอนุมัติแล้วเท่านั้น
// เรียกตอน "อนุมัติทริป" (ไม่ใช่ตอน submit) เพื่อไม่ให้ข้อมูลรั่วก่อนอนุมัติ
export async function syncSharedReviewsForTrip(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { authorId: true, isPublished: true, approvalStatus: true },
  });
  if (!trip || !trip.isPublished || trip.approvalStatus !== "APPROVED") return;

  const stops = await prisma.timelineStop.findMany({
    where: {
      tripId,
      shareToPlace: true,
      placeId: { not: null },
      description: { not: "" },
      place: { approvalStatus: "APPROVED" },
    },
    select: { description: true, placeId: true },
  });

  for (const stop of stops) {
    const text = stop.description.trim();
    if (!text || !stop.placeId) continue;
    const existing = await prisma.review.findFirst({
      where: { authorId: trip.authorId, placeId: stop.placeId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.review.create({
        data: { authorId: trip.authorId, placeId: stop.placeId, rating: 5, text },
      });
    }
  }
}

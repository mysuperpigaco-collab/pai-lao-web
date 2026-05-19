import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/likes — toggle like on a trip or place
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { tripId, placeId } = await request.json();
    if (!tripId && !placeId) {
      return NextResponse.json({ message: "ต้องระบุ tripId หรือ placeId" }, { status: 400 });
    }

    const userId = session.userId;

    if (tripId) {
      const existing = await prisma.tripLike.findUnique({
        where: { userId_tripId: { userId, tripId } },
      });
      if (existing) {
        await prisma.tripLike.delete({ where: { id: existing.id } });
        const count = await prisma.tripLike.count({ where: { tripId } });
        return NextResponse.json({ liked: false, count });
      }
      await prisma.tripLike.create({ data: { userId, tripId } });
      const count = await prisma.tripLike.count({ where: { tripId } });
      return NextResponse.json({ liked: true, count }, { status: 201 });
    }

    // placeId
    const existing = await prisma.placeLike.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    if (existing) {
      await prisma.placeLike.delete({ where: { id: existing.id } });
      const count = await prisma.placeLike.count({ where: { placeId } });
      return NextResponse.json({ liked: false, count });
    }
    await prisma.placeLike.create({ data: { userId, placeId } });
    const count = await prisma.placeLike.count({ where: { placeId } });
    return NextResponse.json({ liked: true, count }, { status: 201 });

  } catch (error) {
    console.error("POST /api/likes:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

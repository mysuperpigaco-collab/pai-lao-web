import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── POST /api/bookmarks — toggle (add/remove) ─────────────
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { tripId, placeId } = await request.json();
    if (!tripId && !placeId) {
      return NextResponse.json({ message: "ต้องระบุ tripId หรือ placeId" }, { status: 400 });
    }

    const userId = session.userId;
    const where  = tripId
      ? { userId_tripId:   { userId, tripId } }
      : { userId_placeId:  { userId, placeId } };

    const existing = await (prisma.bookmark as any).findUnique({ where });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ bookmarked: false, message: "ลบบุ๊กมาร์กแล้ว" });
    }

    await prisma.bookmark.create({
      data: { userId, tripId: tripId ?? null, placeId: placeId ?? null },
    });
    return NextResponse.json({ bookmarked: true, message: "บุ๊กมาร์กแล้ว" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookmarks:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── GET /api/bookmarks — ดึง bookmarks ของ user ───────────
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: session.userId },
      include: {
        trip:  { select: { id: true, slug: true, title: true, titleStyle: true, coverUrl: true, mood: true } },
        place: { select: { id: true, slug: true, title: true, coverUrl: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error("GET /api/bookmarks:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

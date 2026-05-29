import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/trips/draft — ดึง draft ของ user ปัจจุบัน
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ draft: null });

    const draft = await (prisma as any).trip.findFirst({
      where: { authorId: session.userId, isDraft: true },
      include: {
        timeline: { orderBy: { order: "asc" }, select: { id: true, placeName: true, province: true, stopType: true } },
      },
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("GET /api/trips/draft:", error);
    return NextResponse.json({ draft: null });
  }
}

// DELETE /api/trips/draft — ลบ draft ทิ้ง
export async function DELETE() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const draft = await (prisma as any).trip.findFirst({ where: { authorId: session.userId, isDraft: true } });
    if (!draft) return NextResponse.json({ message: "ไม่พบบันทึกชั่วคราว" }, { status: 404 });

    await prisma.trip.delete({ where: { id: draft.id } });
    return NextResponse.json({ message: "ลบบันทึกชั่วคราวแล้ว" });
  } catch (error) {
    console.error("DELETE /api/trips/draft:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

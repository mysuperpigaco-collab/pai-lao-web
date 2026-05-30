import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/trips/draft — ดึง drafts ทั้งหมดของ user (สูงสุด 2 อัน)
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ drafts: [], draft: null });

    const drafts = await (prisma as any).trip.findMany({
      where: { authorId: session.userId, isDraft: true },
      orderBy: { updatedAt: "desc" },
      include: {
        timeline: { orderBy: { order: "asc" }, select: { id: true, placeName: true, province: true, stopType: true } },
      },
    });

    return NextResponse.json({ drafts, draft: drafts[0] ?? null });
  } catch (error) {
    console.error("GET /api/trips/draft:", error);
    return NextResponse.json({ drafts: [], draft: null });
  }
}

// DELETE /api/trips/draft?id=xxx — ลบ draft ตาม id
export async function DELETE(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const draftId = searchParams.get("id");

    let draft;
    if (draftId) {
      draft = await (prisma as any).trip.findFirst({ where: { id: draftId, authorId: session.userId, isDraft: true } });
    } else {
      draft = await (prisma as any).trip.findFirst({ where: { authorId: session.userId, isDraft: true } });
    }

    if (!draft) return NextResponse.json({ message: "ไม่พบบันทึกชั่วคราว" }, { status: 404 });

    await prisma.trip.delete({ where: { id: draft.id } });
    return NextResponse.json({ message: "ลบบันทึกชั่วคราวแล้ว" });
  } catch (error) {
    console.error("DELETE /api/trips/draft:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

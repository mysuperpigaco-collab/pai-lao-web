import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// POST /api/reviews/[id]/hide — toggle isHidden for owner
export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, authorId: true, isHidden: true },
    });
    if (!review) return NextResponse.json({ message: "ไม่พบรีวิว" }, { status: 404 });
    if (review.authorId !== session.userId) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { isHidden: !review.isHidden },
      select: { id: true, isHidden: true },
    });

    return NextResponse.json({ isHidden: updated.isHidden });
  } catch (error) {
    console.error("POST /api/reviews/[id]/hide:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

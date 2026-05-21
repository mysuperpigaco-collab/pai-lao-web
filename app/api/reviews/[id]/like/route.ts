import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/reviews/[id]/like  — toggle like on a review
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      return NextResponse.json({ message: "แอดมินไม่สามารถกดไลท์รีวิวได้" }, { status: 403 });
    }

    const { id: reviewId } = await params;
    const { action } = await request.json(); // "like" | "unlike"

    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { id: true, likes: true } });
    if (!review) return NextResponse.json({ message: "ไม่พบรีวิว" }, { status: 404 });

    const newLikes = action === "unlike"
      ? Math.max(0, review.likes - 1)
      : review.likes + 1;

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { likes: newLikes },
      select: { id: true, likes: true },
    });

    return NextResponse.json({ likes: updated.likes });
  } catch (error) {
    console.error("POST /api/reviews/[id]/like:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

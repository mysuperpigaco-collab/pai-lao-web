import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── POST /api/reviews/[id]/reply — ตอบกลับรีวิว (ทุก user ที่ login แล้ว)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ message: "กรุณากรอกข้อความตอบกลับ" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ message: "ไม่พบรีวิว" }, { status: 404 });
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        authorId: session.userId,
        text: text.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json({ message: "ตอบกลับสำเร็จ", reply }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/[id]/reply:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── POST /api/reviews/[id]/reply — เจ้าของสถานที่ตอบรีวิว ──
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

    // Load the review to verify it belongs to a place owned by this user
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        place: {
          select: {
            id: true,
            business: { select: { userId: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ message: "ไม่พบรีวิว" }, { status: 404 });
    }

    // Only the business owner of that place (or ADMIN) can reply
    const isOwner =
      session.role === "ADMIN" ||
      (review.place?.business?.userId === session.userId);

    if (!isOwner) {
      return NextResponse.json(
        { message: "เฉพาะเจ้าของสถานที่เท่านั้นที่สามารถตอบรีวิวได้" },
        { status: 403 }
      );
    }

    const reply = await prisma.reviewReply.create({
      data: {
        reviewId,
        authorId: session.userId,
        text: text.trim(),
      },
      include: {
        author: {
          select: { id: true, username: true, firstName: true, displayName: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ message: "ตอบกลับสำเร็จ", reply }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/[id]/reply:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

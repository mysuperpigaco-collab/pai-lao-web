import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── POST /api/reviews — เขียนรีวิว ───────────────────────
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { tripId, placeId, rating, text } = await request.json();

    if (!rating || !text) {
      return NextResponse.json({ message: "กรุณากรอกคะแนนและความคิดเห็น" }, { status: 400 });
    }
    if (!tripId && !placeId) {
      return NextResponse.json({ message: "ต้องระบุ tripId หรือ placeId" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ message: "คะแนนต้องอยู่ระหว่าง 1-5" }, { status: 400 });
    }

    // ── ตรวจสอบว่าเคยรีวิวแล้วหรือยัง (1 user = 1 review per trip/place) ──
    const existing = await prisma.review.findFirst({
      where: {
        authorId: session.userId,
        ...(tripId  ? { tripId }  : {}),
        ...(placeId ? { placeId } : {}),
      },
    });
    if (existing) {
      return NextResponse.json(
        { message: "คุณได้รีวิวแล้ว · You have already reviewed this", alreadyReviewed: true },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        authorId: session.userId,
        tripId:   tripId  ?? null,
        placeId:  placeId ?? null,
        rating:   Number(rating),
        text,
      },
      include: {
        author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ message: "รีวิวสำเร็จ", review }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

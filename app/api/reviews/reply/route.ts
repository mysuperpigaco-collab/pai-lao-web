import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { reviewId, text } = await request.json();
    if (!reviewId || !text) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    const reply = await prisma.reviewReply.create({
      data: { reviewId, authorId: session.userId, text },
      include: {
        author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ message: "ตอบกลับสำเร็จ", reply }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/reply:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

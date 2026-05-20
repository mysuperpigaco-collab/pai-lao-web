import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/reviews/notifications — รีวิวของ user ที่มีคนตอบกลับ
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const reviews = await prisma.review.findMany({
      where: {
        authorId: session.userId,
        replies: { some: {} },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        text: true,
        createdAt: true,
        place: { select: { slug: true, title: true } },
        trip:  { select: { slug: true, title: true } },
        replies: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true, role: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error("GET /api/reviews/notifications:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

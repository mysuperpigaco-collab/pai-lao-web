import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ username: string }> };

// GET /api/users/[username]/reviews — public reviews by this user
export async function GET(_req: Request, { params }: Params) {
  try {
    const { username } = await params;
    const session = await getCurrentUser().catch(() => null);

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

    const isOwn = session?.userId === user.id;

    const reviews = await prisma.review.findMany({
      where: {
        authorId: user.id,
        ...(isOwn ? {} : { isHidden: false }),  // owner sees all; others see only non-hidden
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, rating: true, text: true, createdAt: true,
        isAnonymous: true, isHidden: true, likes: true,
        trip:  { select: { slug: true, title: true, coverUrl: true } },
        place: { select: { slug: true, title: true, coverUrl: true } },
      },
    });

    return NextResponse.json({ reviews, isOwn });
  } catch (error) {
    console.error("GET /api/users/[username]/reviews:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

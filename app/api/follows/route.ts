import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// POST /api/follows — toggle follow for a user
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { followingId } = await request.json();
    if (!followingId) {
      return NextResponse.json({ message: "ต้องระบุ followingId" }, { status: 400 });
    }

    const followerId = session.userId;
    if (followerId === followingId) {
      return NextResponse.json({ message: "ไม่สามารถติดตามตัวเองได้" }, { status: 400 });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      const count = await prisma.follow.count({ where: { followingId } });
      return NextResponse.json({ following: false, followerCount: count });
    }

    await prisma.follow.create({ data: { followerId, followingId } });
    const count = await prisma.follow.count({ where: { followingId } });
    return NextResponse.json({ following: true, followerCount: count }, { status: 201 });

  } catch (error) {
    console.error("POST /api/follows:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

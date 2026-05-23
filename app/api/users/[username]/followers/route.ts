import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ username: string }> };

// GET /api/users/[username]/followers?type=followers|following
export async function GET(_req: Request, { params }: Params) {
  try {
    const { username } = await params;
    const url = new URL(_req.url);
    const type = url.searchParams.get("type") ?? "followers"; // "followers" | "following"

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

    if (type === "following") {
      const rows = await prisma.follow.findMany({
        where: { followerId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          following: {
            select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true, role: true },
          },
        },
      });
      return NextResponse.json({ users: rows.map(r => r.following) });
    } else {
      const rows = await prisma.follow.findMany({
        where: { followingId: user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          follower: {
            select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true, role: true },
          },
        },
      });
      return NextResponse.json({ users: rows.map(r => r.follower) });
    }
  } catch (error) {
    console.error("GET /api/users/[username]/followers:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

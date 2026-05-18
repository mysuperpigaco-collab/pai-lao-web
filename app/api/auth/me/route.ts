import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();

  if (!session) {
    return NextResponse.json({ message: "ยังไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      coverUrl: true,
      bio: true,
      role: true,
      business: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          isVerified: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

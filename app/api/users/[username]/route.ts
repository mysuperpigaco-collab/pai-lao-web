import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ username: string }> };

// GET /api/users/[username] — public profile
export async function GET(_req: Request, { params }: Params) {
  try {
    const { username } = await params;
    const session = await getCurrentUser().catch(() => null);

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, displayName: true, firstName: true,
        avatarUrl: true, coverUrl: true, profileCovers: true, bio: true,
        gender: true, birthDate: true,
        lineId: true, facebook: true, instagram: true, tiktok: true,
        email: true, phone: true,
        role: true,
        profilePrivacy: true,
        showEmail: true, showPhone: true, showSocial: true, showBirthDate: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true, trips: true },
        },
      },
    });

    if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });

    // If profile is PRIVATE and viewer is not the owner → show minimal info only
    const isOwn = session?.userId === user.id;
    if (user.profilePrivacy === "PRIVATE" && !isOwn) {
      return NextResponse.json({
        user: {
          id: user.id, username: user.username,
          displayName: user.displayName, firstName: user.firstName,
          avatarUrl: user.avatarUrl, role: user.role,
          isPrivate: true,
        },
      });
    }

    // Apply field-level privacy
    const pub: Record<string, any> = {
      id: user.id, username: user.username,
      displayName: user.displayName, firstName: user.firstName,
      avatarUrl: user.avatarUrl, coverUrl: user.coverUrl,
      profileCovers: user.profileCovers,
      bio: user.bio, role: user.role,
      createdAt: user.createdAt,
      _count: user._count,
      isPrivate: false,
    };
    if (user.showEmail)     pub.email      = user.email;
    if (user.showPhone)     pub.phone      = user.phone;
    if (user.showSocial)    { pub.lineId = user.lineId; pub.facebook = user.facebook; pub.instagram = user.instagram; pub.tiktok = user.tiktok; }
    if (user.showBirthDate) pub.birthDate  = user.birthDate;

    // Published trips by this user
    const trips = await prisma.trip.findMany({
      where: { authorId: user.id, isPublished: true, approvalStatus: "APPROVED", isDraft: false },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true, slug: true, title: true, coverUrl: true,
        mood: true, location: true, createdAt: true,
        _count: { select: { likes: true, bookmarks: true } },
      },
    });

    return NextResponse.json({ user: pub, trips });
  } catch (error) {
    console.error("GET /api/users/[username]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

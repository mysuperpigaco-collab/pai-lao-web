import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.userId, tripId: { not: null } },
    include: {
      trip: {
        select: {
          id: true, slug: true, title: true, titleStyle: true, coverUrl: true, mood: true,
          isPublished: true, approvalStatus: true,
          timeline: {
            orderBy: { order: "asc" },
            select: {
              id: true, order: true, placeName: true, province: true, district: true,
              description: true, googleMapsUrl: true, stopType: true, placeId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const trips = bookmarks
    .map(b => b.trip)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return NextResponse.json({ trips });
}

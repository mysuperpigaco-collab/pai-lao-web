import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const [
    totalUsers, totalTravelers, totalBusiness, totalAdmins, totalSuperAdmins,
    totalTrips, publishedTrips,
    totalPlaces, verifiedPlaces,
    totalReviews, totalReplies,
    pendingReports, totalReports,
    totalBookmarks, totalLikes,
    recentUsers, recentTrips, recentReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TRAVELER" } }),
    prisma.user.count({ where: { role: "BUSINESS" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.trip.count(),
    prisma.trip.count({ where: { isPublished: true } }),
    prisma.place.count(),
    prisma.place.count({ where: { isVerified: true } }),
    prisma.review.count(),
    prisma.reviewReply.count(),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.report.count(),
    prisma.bookmark.count(),
    prisma.tripLike.count().then(t => prisma.placeLike.count().then(p => t + p)),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, role: true, createdAt: true },
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true, coverUrl: true, isPublished: true, createdAt: true,
        author: { select: { username: true, displayName: true } },
        _count: { select: { likes: true, reviews: true } },
      },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, targetType: true, reason: true, status: true, createdAt: true,
        reporter: { select: { username: true, displayName: true } },
      },
    }),
  ]);

  // Top trips by likes
  const topTrips = await prisma.trip.findMany({
    orderBy: { likes: { _count: "desc" } },
    take: 10,
    select: { id: true, slug: true, title: true, coverUrl: true,
      _count: { select: { likes: true, reviews: true } },
      author: { select: { username: true } },
    },
  });

  // Top places by reviews
  const topPlaces = await prisma.place.findMany({
    orderBy: { reviews: { _count: "desc" } },
    take: 10,
    select: { id: true, slug: true, title: true, coverUrl: true, category: true, province: true,
      _count: { select: { reviews: true, likes: true } },
    },
  });

  return NextResponse.json({
    users: { total: totalUsers, traveler: totalTravelers, business: totalBusiness, admin: totalAdmins, superadmin: totalSuperAdmins },
    trips: { total: totalTrips, published: publishedTrips, draft: totalTrips - publishedTrips },
    places: { total: totalPlaces, verified: verifiedPlaces, unverified: totalPlaces - verifiedPlaces },
    reviews: { total: totalReviews, replies: totalReplies },
    reports: { pending: pendingReports, total: totalReports },
    engagement: { bookmarks: totalBookmarks, likes: totalLikes },
    recentUsers, recentTrips, recentReports,
    topTrips, topPlaces,
  });
}

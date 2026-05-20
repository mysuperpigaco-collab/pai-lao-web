import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/database — table stats (SUPERADMIN only)
export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "SUPERADMIN") {
    return NextResponse.json({ message: "ต้องการสิทธิ์ SUPERADMIN" }, { status: 403 });
  }

  const [
    users, businesses, places, trips, reviews, reviewReplies,
    bookmarks, tripLikes, placeLikes, follows, reports, adminLogs,
    timelineStops,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.place.count(),
    prisma.trip.count(),
    prisma.review.count(),
    prisma.reviewReply.count(),
    prisma.bookmark.count(),
    prisma.tripLike.count(),
    prisma.placeLike.count(),
    prisma.follow.count(),
    prisma.report.count(),
    prisma.adminLog.count(),
    prisma.timelineStop.count(),
  ]);

  // Recent records per table
  const [recentUsers, recentTrips, recentPlaces, recentReports, recentLogs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, username: true, email: true, role: true, createdAt: true } }),
    prisma.trip.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, createdAt: true, author: { select: { username: true } } } }),
    prisma.place.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, slug: true, title: true, category: true, createdAt: true } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, targetType: true, reason: true, status: true, createdAt: true } }),
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return NextResponse.json({
    tables: [
      { name: "User",         count: users },
      { name: "Business",     count: businesses },
      { name: "Place",        count: places },
      { name: "Trip",         count: trips },
      { name: "Review",       count: reviews },
      { name: "ReviewReply",  count: reviewReplies },
      { name: "TimelineStop", count: timelineStops },
      { name: "Bookmark",     count: bookmarks },
      { name: "TripLike",     count: tripLikes },
      { name: "PlaceLike",    count: placeLikes },
      { name: "Follow",       count: follows },
      { name: "Report",       count: reports },
      { name: "AdminLog",     count: adminLogs },
    ],
    recentUsers, recentTrips, recentPlaces, recentReports, recentLogs,
  });
}

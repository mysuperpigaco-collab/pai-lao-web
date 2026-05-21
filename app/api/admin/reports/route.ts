import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/reports?status=&targetType=&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status     = searchParams.get("status") || "";
  const targetType = searchParams.get("targetType") || "";
  const page       = parseInt(searchParams.get("page") || "1");
  const limit      = parseInt(searchParams.get("limit") || "20");
  const skip       = (page - 1) * limit;

  const where: any = {};
  if (status)     where.status = status;
  if (targetType) where.targetType = targetType;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, targetId: true, targetType: true, reason: true,
        detail: true, status: true, createdAt: true,
        reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  // Enrich with slug for TRIP / PLACE targets (for direct links)
  const enriched = await Promise.all(
    reports.map(async (r) => {
      let targetSlug: string | null = null;
      let targetTitle: string | null = null;

      if (r.targetType === "TRIP") {
        const trip = await prisma.trip.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true } });
        targetSlug = trip?.slug ?? null;
        targetTitle = trip?.title ?? null;
      } else if (r.targetType === "PLACE") {
        const place = await prisma.place.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true } });
        targetSlug = place?.slug ?? null;
        targetTitle = place?.title ?? null;
      } else if (r.targetType === "REVIEW" || r.targetType === "REPLY") {
        // Find which trip/place this review belongs to
        const review = await prisma.review.findUnique({
          where: { id: r.targetId },
          select: {
            trip:  { select: { slug: true, title: true } },
            place: { select: { slug: true, title: true } },
          },
        }).catch(() => null);
        if (review?.trip)  { targetSlug = review.trip.slug;  targetTitle = review.trip.title; }
        if (review?.place) { targetSlug = review.place.slug; targetTitle = review.place.title; }
      }

      return { ...r, targetSlug, targetTitle };
    })
  );

  return NextResponse.json({ reports: enriched, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/reports — resolve or dismiss
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { reportId, action } = await request.json();
  if (!reportId) return NextResponse.json({ message: "กรุณาระบุ reportId" }, { status: 400 });

  const validActions = ["REVIEWED", "DISMISSED"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ message: "ไม่พบรายงาน" }, { status: 404 });

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status: action },
    select: { id: true, status: true, targetType: true, reason: true },
  });

  await prisma.adminLog.create({
    data: {
      adminId: session.userId,
      action: action === "REVIEWED" ? "RESOLVE_REPORT" : "DISMISS_REPORT",
      targetId: reportId,
      targetType: "REPORT",
      detail: `${report.targetType} — ${report.reason}`,
    },
  });

  return NextResponse.json({ message: "อัปเดตสำเร็จ", report: updated });
}

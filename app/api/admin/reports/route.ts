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
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, targetId: true, targetType: true, reason: true,
        detail: true, status: true, createdAt: true,
        reporter: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  // Enrich with slug + title + reported user info
  const enriched = await Promise.all(
    reports.map(async (r) => {
      let targetSlug: string | null = null;
      let targetTitle: string | null = null;
      let reportedUserId: string | null = null;
      let reportedUser: { id: string; username: string; displayName: string | null; avatarUrl: string | null; postBannedUntil: Date | null; bannedUntil: Date | null } | null = null;

      if (r.targetType === "TRIP") {
        const trip = await prisma.trip.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true, authorId: true } });
        targetSlug = trip?.slug ?? null;
        targetTitle = trip?.title ?? null;
        reportedUserId = trip?.authorId ?? null;
      } else if (r.targetType === "PLACE") {
        const place = await prisma.place.findUnique({ where: { id: r.targetId }, select: { slug: true, title: true, business: { select: { userId: true } } } });
        targetSlug = place?.slug ?? null;
        targetTitle = place?.title ?? null;
        reportedUserId = place?.business?.userId ?? null;
      } else if (r.targetType === "REVIEW") {
        const review = await prisma.review.findUnique({
          where: { id: r.targetId },
          select: { authorId: true, trip: { select: { slug: true, title: true } }, place: { select: { slug: true, title: true } } },
        }).catch(() => null);
        if (review?.trip)  { targetSlug = review.trip.slug;  targetTitle = review.trip.title; }
        if (review?.place) { targetSlug = review.place.slug; targetTitle = review.place.title; }
        reportedUserId = review?.authorId ?? null;
      } else if (r.targetType === "REPLY") {
        const reply = await prisma.reviewReply.findUnique({
          where: { id: r.targetId },
          select: { authorId: true, review: { select: { trip: { select: { slug: true, title: true } }, place: { select: { slug: true, title: true } } } } },
        }).catch(() => null);
        if (reply?.review?.trip)  { targetSlug = reply.review.trip.slug;  targetTitle = reply.review.trip.title; }
        if (reply?.review?.place) { targetSlug = reply.review.place.slug; targetTitle = reply.review.place.title; }
        reportedUserId = reply?.authorId ?? null;
      } else if (r.targetType === "USER") {
        reportedUserId = r.targetId;
      }

      if (reportedUserId) {
        reportedUser = await prisma.user.findUnique({
          where: { id: reportedUserId },
          select: { id: true, username: true, displayName: true, avatarUrl: true, postBannedUntil: true, bannedUntil: true },
        }) ?? null;
      }

      return { ...r, targetSlug, targetTitle, reportedUserId, reportedUser };
    })
  );

  return NextResponse.json({ reports: enriched, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/reports — enforcement
// Body: { reportId, removeContent?, punishment?, duration?, note? }
// punishment: "NONE" | "WARN" | "POST_BAN" | "ACCOUNT_BAN"
// duration: number (days) | null (permanent)
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const body = await request.json();
  const { reportId, removeContent, punishment, duration, note, dismiss } = body;
  if (!reportId) return NextResponse.json({ message: "กรุณาระบุ reportId" }, { status: 400 });

  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) return NextResponse.json({ message: "ไม่พบรายงาน" }, { status: 404 });

  // ── Dismiss ────────────────────────────────────────────────
  if (dismiss) {
    await prisma.report.update({ where: { id: reportId }, data: { status: "DISMISSED" } });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "DISMISS_REPORT",
      targetId: reportId, targetType: "REPORT", detail: note || "ยกเลิกรายงาน",
    }});
    return NextResponse.json({ message: "ยกเลิกรายงานสำเร็จ" });
  }

  const actions: string[] = [];

  // ── 1. ลบเนื้อหา ───────────────────────────────────────────
  if (removeContent) {
    try {
      if (report.targetType === "REVIEW") {
        await prisma.review.delete({ where: { id: report.targetId } });
        actions.push("ลบรีวิว");
      } else if (report.targetType === "REPLY") {
        await prisma.reviewReply.delete({ where: { id: report.targetId } });
        actions.push("ลบการตอบกลับ");
      } else if (report.targetType === "TRIP") {
        await prisma.trip.delete({ where: { id: report.targetId } });
        actions.push("ลบทริป");
      } else if (report.targetType === "PLACE") {
        await prisma.place.delete({ where: { id: report.targetId } });
        actions.push("ลบสถานที่");
      }
    } catch (e) {
      // content may already be deleted
    }
  }

  // ── 2. หาผู้ใช้ที่จะรับโทษ ───────────────────────────────
  let reportedUserId: string | null = null;
  if (punishment && punishment !== "NONE" && punishment !== "WARN") {
    if (report.targetType === "TRIP") {
      const t = await prisma.trip.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).catch(() => null);
      reportedUserId = t?.authorId ?? null;
    } else if (report.targetType === "PLACE") {
      const p = await prisma.place.findUnique({ where: { id: report.targetId }, select: { business: { select: { userId: true } } } }).catch(() => null);
      reportedUserId = p?.business?.userId ?? null;
    } else if (report.targetType === "REVIEW") {
      const r = await prisma.review.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).catch(() => null);
      reportedUserId = r?.authorId ?? null;
    } else if (report.targetType === "REPLY") {
      const r = await prisma.reviewReply.findUnique({ where: { id: report.targetId }, select: { authorId: true } }).catch(() => null);
      reportedUserId = r?.authorId ?? null;
    } else if (report.targetType === "USER") {
      reportedUserId = report.targetId;
    }
  }

  // ── 3. บังคับใช้โทษ ────────────────────────────────────────
  if (reportedUserId && punishment && punishment !== "NONE") {
    const banUntil = duration != null
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
      : new Date("2099-12-31"); // permanent

    const reason = note || `ถูกรายงาน: ${report.reason}`;
    const durationLabel = duration == null ? "ถาวร" : `${duration} วัน`;

    if (punishment === "WARN") {
      // Warn only — no ban, just log
      actions.push("ส่งคำเตือน");
    } else if (punishment === "POST_BAN") {
      await prisma.user.update({
        where: { id: reportedUserId },
        data: { postBannedUntil: banUntil, banReason: reason },
      });
      actions.push(`ห้ามโพส ${durationLabel}`);
    } else if (punishment === "ACCOUNT_BAN") {
      await prisma.user.update({
        where: { id: reportedUserId },
        data: { bannedUntil: banUntil, banReason: reason },
      });
      actions.push(`ระงับบัญชี ${durationLabel}`);
    }

    await prisma.adminLog.create({ data: {
      adminId: session.userId,
      action: punishment === "POST_BAN" ? "POST_BAN_USER" : punishment === "ACCOUNT_BAN" ? "BAN_USER" : "WARN_USER",
      targetId: reportedUserId, targetType: "USER",
      detail: `เหตุผล: ${reason} | ระยะเวลา: ${durationLabel}`,
    }});
  }

  // ── 4. อัปเดตสถานะ report ──────────────────────────────────
  await prisma.report.update({ where: { id: reportId }, data: { status: "REVIEWED" } });

  await prisma.adminLog.create({ data: {
    adminId: session.userId, action: "RESOLVE_REPORT",
    targetId: reportId, targetType: "REPORT",
    detail: actions.length ? actions.join(", ") : (note || "ดำเนินการแล้ว"),
  }});

  return NextResponse.json({ message: "ดำเนินการสำเร็จ", actions });
}

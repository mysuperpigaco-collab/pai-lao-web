import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncSharedReviewsForTrip } from "@/lib/sharedReviews";

// GET /api/admin/pending-edits?type=TRIP|PLACE&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type  = searchParams.get("type") || "";
  const page  = parseInt(searchParams.get("page")  || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip  = (page - 1) * limit;

  const where: any = { status: "PENDING" };
  if (type) where.targetType = type;

  const [edits, total] = await Promise.all([
    (prisma as any).pendingEdit.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        submittedBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    (prisma as any).pendingEdit.count({ where }),
  ]);

  // Enrich with target info (title, slug) — batch queries instead of N+1
  const tripIds  = edits.filter((e: any) => e.targetType === "TRIP" ).map((e: any) => e.targetId);
  const placeIds = edits.filter((e: any) => e.targetType === "PLACE").map((e: any) => e.targetId);

  const [trips, places] = await Promise.all([
    tripIds.length  > 0 ? prisma.trip.findMany ({ where: { id: { in: tripIds  } }, select: { id: true, title: true, slug: true } }) : [],
    placeIds.length > 0 ? prisma.place.findMany({ where: { id: { in: placeIds } }, select: { id: true, title: true, slug: true } }) : [],
  ]);

  const tripMap  = Object.fromEntries(trips.map( (t: any) => [t.id, t]));
  const placeMap = Object.fromEntries(places.map((p: any) => [p.id, p]));

  const enriched = edits.map((edit: any) => {
    const target = edit.targetType === "TRIP" ? tripMap[edit.targetId] : placeMap[edit.targetId];
    return { ...edit, targetTitle: target?.title ?? null, targetSlug: target?.slug ?? null };
  });

  return NextResponse.json({ edits: enriched, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/pending-edits — approve | reject
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { editId, action, rejectionReason } = await request.json();
  if (!editId || !action) return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });

  const edit = await (prisma as any).pendingEdit.findUnique({ where: { id: editId } });
  if (!edit) return NextResponse.json({ message: "ไม่พบ pending edit" }, { status: 404 });

  if (action === "approve") {
    const data = edit.pendingData as Record<string, any>;

    if (edit.targetType === "TRIP") {
      const trip = await prisma.trip.findUnique({
        where: { id: edit.targetId },
        select: { slug: true },
      }).catch(() => null);
      if (trip) {
        // Handle timeline separately
        if (data.timeline) {
          const { timeline, ...rest } = data;
          // transaction: กัน timeline หายถาวรถ้า update ล้มหลัง deleteMany
          await prisma.$transaction([
            prisma.timelineStop.deleteMany({ where: { tripId: edit.targetId } }),
            prisma.trip.update({
              where: { id: edit.targetId },
              data: {
                ...rest,
                approvalStatus: "APPROVED",
                isPublished: true,
                rejectionReason: null,
                timeline: {
                  create: (timeline as any[]).map((stop: any, i: number) => ({
                    order: i, date: stop.date ?? "", time: stop.time ?? "",
                    placeName: stop.place ?? stop.placeName ?? "",
                    province: stop.province ?? "", district: stop.district ?? "",
                    description: stop.description ?? "",
                    transport: stop.transport ?? null, duration: stop.duration ?? null,
                    cost: stop.cost ?? null,
                    images: stop.images ?? (stop.image ? [stop.image] : []),
                    stopType:      stop.stopType      ?? null,
                    googleMapsUrl: stop.googleMapsUrl ?? null,
                    tips:          stop.tips          ?? null,
                    shareToPlace:  stop.shareToPlace  ?? false,
                    rating:        stop.rating        ? Number(stop.rating) : null,
                    placeId:       stop.placeId       ?? null,
                    lat:           stop.lat           ?? null,
                    lng:           stop.lng           ?? null,
                  })),
                },
              },
            }),
          ]);
        } else {
          await prisma.trip.update({ where: { id: edit.targetId }, data: { ...data, approvalStatus: "APPROVED", isPublished: true, rejectionReason: null } });
        }
        await syncSharedReviewsForTrip(edit.targetId).catch(() => {});
      }
    } else if (edit.targetType === "PLACE") {
      await prisma.place.update({
        where: { id: edit.targetId },
        data: { ...data, approvalStatus: "APPROVED", rejectionReason: null },
      }).catch(() => {});
    }

    // approve record นี้ และลบ record ซ้ำ "ที่เก่ากว่า" เท่านั้น
    // (ถ้าเจ้าของ submit แก้ไขใหม่ระหว่างแอดมินกดอนุมัติ อันใหม่ต้องรอดไว้ให้ตรวจต่อ — กัน race ลบงานที่ยังไม่ถูกตรวจ)
    await (prisma as any).pendingEdit.update({
      where: { id: editId },
      data: { status: "APPROVED" },
    });
    await (prisma as any).pendingEdit.deleteMany({
      where: {
        targetId: edit.targetId, targetType: edit.targetType,
        id: { not: editId }, status: { in: ["PENDING", "REJECTED"] },
        createdAt: { lte: edit.createdAt },
      },
    });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "APPROVE_EDIT",
      targetId: editId, targetType: edit.targetType,
      detail: `PendingEdit approved for ${edit.targetType}:${edit.targetId}`,
    }});
    return NextResponse.json({ message: "อนุมัติการแก้ไขสำเร็จ" });
  }

  if (action === "reject") {
    const reason = rejectionReason?.trim() || "ไม่ผ่านเกณฑ์";
    await (prisma as any).pendingEdit.update({
      where: { id: editId },
      data: { status: "REJECTED", rejectionReason: reason },
    });
    // ลบ PENDING ซ้ำ "ที่เก่ากว่า" เท่านั้น (อันใหม่กว่า = การแก้ที่ยังไม่ถูกตรวจ ต้องเก็บไว้)
    await (prisma as any).pendingEdit.deleteMany({
      where: {
        targetId: edit.targetId, targetType: edit.targetType,
        id: { not: editId }, status: "PENDING",
        createdAt: { lte: edit.createdAt },
      },
    });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "REJECT_EDIT",
      targetId: editId, targetType: edit.targetType,
      detail: `PendingEdit rejected | เหตุผล: ${reason}`,
    }});
    return NextResponse.json({ message: "ปฏิเสธการแก้ไขแล้ว" });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

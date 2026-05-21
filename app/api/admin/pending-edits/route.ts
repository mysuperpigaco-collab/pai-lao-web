import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Enrich with target info (title, slug)
  const enriched = await Promise.all(edits.map(async (edit: any) => {
    let targetTitle: string | null = null;
    let targetSlug:  string | null = null;
    if (edit.targetType === "TRIP") {
      const trip = await prisma.trip.findUnique({
        where: { id: edit.targetId },
        select: { title: true, slug: true },
      }).catch(() => null);
      targetTitle = trip?.title ?? null;
      targetSlug  = trip?.slug  ?? null;
    } else if (edit.targetType === "PLACE") {
      const place = await prisma.place.findUnique({
        where: { id: edit.targetId },
        select: { title: true, slug: true },
      }).catch(() => null);
      targetTitle = place?.title ?? null;
      targetSlug  = place?.slug  ?? null;
    }
    return { ...edit, targetTitle, targetSlug };
  }));

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
          await prisma.timelineStop.deleteMany({ where: { tripId: edit.targetId } });
          const { timeline, ...rest } = data;
          await prisma.trip.update({
            where: { id: edit.targetId },
            data: {
              ...rest,
              approvalStatus: "APPROVED",
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
                })),
              },
            },
          });
        } else {
          await prisma.trip.update({ where: { id: edit.targetId }, data: { ...data, approvalStatus: "APPROVED", rejectionReason: null } });
        }
      }
    } else if (edit.targetType === "PLACE") {
      await prisma.place.update({
        where: { id: edit.targetId },
        data: { ...data, approvalStatus: "APPROVED", rejectionReason: null },
      }).catch(() => {});
    }

    await (prisma as any).pendingEdit.update({
      where: { id: editId },
      data: { status: "APPROVED" },
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
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "REJECT_EDIT",
      targetId: editId, targetType: edit.targetType,
      detail: `PendingEdit rejected | เหตุผล: ${reason}`,
    }});
    return NextResponse.json({ message: "ปฏิเสธการแก้ไขแล้ว" });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

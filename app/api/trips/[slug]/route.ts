import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLogger";

type Params = { params: Promise<{ slug: string }> };

// ── GET /api/trips/[slug] ─────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const trip = await prisma.trip.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, username: true, displayName: true, firstName: true, lastName: true, avatarUrl: true, bio: true,
          _count: { select: { trips: true, bookmarks: true } } } },
        timeline: { orderBy: { order: "asc" } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } },
            replies: { include: { author: { select: { id: true, username: true, displayName: true, firstName: true, avatarUrl: true } } } },
          },
        },
        _count: { select: { reviews: true, bookmarks: true } },
      },
    });

    if (!trip) return NextResponse.json({ message: "ไม่พบทริปนี้" }, { status: 404 });

    // ถ้าทริปยังไม่ได้รับการอนุมัติ ให้ดูได้เฉพาะเจ้าของและแอดมิน
    if (trip.approvalStatus !== "APPROVED") {
      const session = await getCurrentUser();
      const isOwner = session?.userId === trip.author.id;
      const isAdmin = session?.role === "ADMIN" || session?.role === "SUPERADMIN";
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ message: "ทริปนี้อยู่ระหว่างการตรวจสอบ" }, { status: 403 });
      }
    }

    const avgRating = trip.reviews.length
      ? trip.reviews.reduce((sum, r) => sum + r.rating, 0) / trip.reviews.length
      : 0;

    return NextResponse.json({ trip: { ...trip, avgRating: Math.round(avgRating * 10) / 10 } });
  } catch (error) {
    console.error("GET /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── PUT /api/trips/[slug] — แก้ไขทริป (ต้องรอ admin อนุมัติ) ─
export async function PUT(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const trip = await prisma.trip.findUnique({
      where: { slug },
      select: {
        id: true, authorId: true, title: true, subtitle: true,
        description: true, coverUrl: true, gallery: true, mood: true,
        budget: true, location: true, tags: true, youtubeUrl: true,
        tiktokUrl: true, isPublished: true, approvalStatus: true, isDraft: true,
      },
    });
    if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });

    const isOwner = trip.authorId === session.userId;
    const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์แก้ไข" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, description, coverUrl, gallery, mood, budget,
            location, tags, isPublished, timeline, youtubeUrl, tiktokUrl } = body;

    // ── แอดมินแก้ไขตรง ──────────────────────────────────────
    if (isAdmin) {
      if (timeline) {
        await prisma.timelineStop.deleteMany({ where: { trip: { slug } } });
      }
      const updated = await prisma.trip.update({
        where: { slug },
        data: {
          ...(title       !== undefined && { title }),
          ...(subtitle    !== undefined && { subtitle }),
          ...(description !== undefined && { description }),
          ...(coverUrl    !== undefined && { coverUrl }),
          ...(gallery     !== undefined && { gallery }),
          ...(mood        !== undefined && { mood }),
          ...(budget      !== undefined && { budget: budget ? Math.round(Number(budget)) : null }),
          ...(location    !== undefined && { location }),
          ...(tags        !== undefined && { tags }),
          ...(youtubeUrl  !== undefined && { youtubeUrl: youtubeUrl || null }),
          ...(tiktokUrl   !== undefined && { tiktokUrl:  tiktokUrl  || null }),
          ...(isPublished !== undefined && { isPublished }),
          ...(timeline?.length && {
            timeline: {
              create: (timeline as any[]).map((stop: any, index: number) => ({
                order: index, date: stop.date ?? "", time: stop.time ?? "",
                placeName: stop.place ?? stop.placeName ?? "",
                province: stop.province ?? "", district: stop.district ?? "",
                description: stop.description ?? "",
                transport: stop.transport ?? null, duration: stop.duration ?? null,
                cost: stop.cost ?? null,
                images: stop.images ?? (stop.image ? [stop.image] : []),
                shareToPlace: stop.shareToPlace ?? false,
              })),
            },
          }),
        },
        include: { timeline: { orderBy: { order: "asc" } } },
      });
      return NextResponse.json({ message: "อัปเดตสำเร็จ", trip: updated });
    }

    // ── ถ้าเป็น draft + ส่ง finalize → เปลี่ยนเป็น PENDING ──────
    if ((trip as any).isDraft) {
      const { finalize } = body;
      if (finalize) {
        // ตรวจสอบจาก request body (ไม่ใช่จาก DB ซึ่งอาจว่างสำหรับ draft)
        const finalTitle       = title       ?? trip.title;
        const finalDescription = description ?? trip.description;
        const finalCoverUrl    = coverUrl    ?? trip.coverUrl;
        if (!finalTitle || !finalDescription || !finalCoverUrl) {
          return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบก่อนเผยแพร่ (ชื่อ คำอธิบาย รูปปก)" }, { status: 400 });
        }
        // ลบ timeline เก่าแล้วสร้างใหม่จาก request body
        if (timeline !== undefined) {
          await prisma.timelineStop.deleteMany({ where: { trip: { slug } } });
        }
        const updated = await (prisma as any).trip.update({
          where: { slug },
          data: {
            isDraft: false, approvalStatus: "PENDING",
            title:       finalTitle,
            description: finalDescription,
            coverUrl:    finalCoverUrl,
            ...(subtitle    !== undefined && { subtitle }),
            ...(gallery     !== undefined && { gallery }),
            ...(mood        !== undefined && { mood }),
            ...(budget      !== undefined && { budget: budget ? Math.round(Number(budget)) : null }),
            ...(location    !== undefined && { location }),
            ...(tags        !== undefined && { tags }),
            ...(youtubeUrl  !== undefined && { youtubeUrl: youtubeUrl || null }),
            ...(tiktokUrl   !== undefined && { tiktokUrl: tiktokUrl  || null }),
            ...(timeline?.length && {
              timeline: {
                create: (timeline as any[]).map((stop: any, index: number) => ({
                  order: index, date: stop.date ?? "", time: stop.time ?? "",
                  placeName: stop.place ?? stop.placeName ?? "",
                  province: stop.province ?? "", district: stop.district ?? "",
                  description: stop.description ?? "",
                  images: stop.images ?? [],
                  stopType: stop.stopType ?? null,
                  googleMapsUrl: stop.googleMapsUrl ?? null,
                  shareToPlace: stop.shareToPlace ?? false,
                  placeId: stop.placeId ?? null,
                })),
              },
            }),
          },
          include: { timeline: { orderBy: { order: "asc" } } },
        });
        return NextResponse.json({ message: "ส่งทริปเพื่อรอการอนุมัติแล้ว", trip: updated, pending: true });
      }
      // ไม่ finalize — แค่ update draft ตรง ๆ (รวม timeline)
      if (timeline !== undefined) {
        await prisma.timelineStop.deleteMany({ where: { trip: { slug } } });
      }
      const updated = await (prisma as any).trip.update({
        where: { slug },
        data: {
          ...(title       !== undefined && { title }),
          ...(subtitle    !== undefined && { subtitle }),
          ...(description !== undefined && { description }),
          ...(coverUrl    !== undefined && { coverUrl }),
          ...(gallery     !== undefined && { gallery }),
          ...(mood        !== undefined && { mood }),
          ...(budget      !== undefined && { budget: budget ? Math.round(Number(budget)) : null }),
          ...(location    !== undefined && { location }),
          ...(tags        !== undefined && { tags }),
          ...(youtubeUrl  !== undefined && { youtubeUrl: youtubeUrl || null }),
          ...(tiktokUrl   !== undefined && { tiktokUrl: tiktokUrl  || null }),
          ...(timeline?.length && {
            timeline: {
              create: (timeline as any[]).map((stop: any, index: number) => ({
                order: index, date: stop.date ?? "", time: stop.time ?? "",
                placeName: stop.place ?? stop.placeName ?? "",
                province: stop.province ?? "", district: stop.district ?? "",
                description: stop.description ?? "",
                images: stop.images ?? [],
                stopType: stop.stopType ?? null,
                googleMapsUrl: stop.googleMapsUrl ?? null,
                shareToPlace: stop.shareToPlace ?? false,
                placeId: stop.placeId ?? null,
              })),
            },
          }),
        },
        include: { timeline: { orderBy: { order: "asc" } } },
      });
      return NextResponse.json({ message: "บันทึกแบบร่างแล้ว", trip: updated });
    }

    // ── เจ้าของ: สร้าง PendingEdit รอตรวจสอบ ─────────────────
    const originalData = {
      title: trip.title, subtitle: trip.subtitle,
      description: trip.description, coverUrl: trip.coverUrl,
      gallery: trip.gallery, mood: trip.mood,
      budget: trip.budget ? Number(trip.budget) : null,
      location: trip.location, tags: trip.tags,
      youtubeUrl: trip.youtubeUrl, tiktokUrl: trip.tiktokUrl,
    };

    const pendingData: Record<string, any> = {};
    if (title       !== undefined) pendingData.title       = title;
    if (subtitle    !== undefined) pendingData.subtitle    = subtitle;
    if (description !== undefined) pendingData.description = description;
    if (coverUrl    !== undefined) pendingData.coverUrl    = coverUrl;
    if (gallery     !== undefined) pendingData.gallery     = gallery;
    if (mood        !== undefined) pendingData.mood        = mood;
    if (budget      !== undefined) pendingData.budget      = budget ? Number(budget) : null;
    if (location    !== undefined) pendingData.location    = location;
    if (tags        !== undefined) pendingData.tags        = tags;
    if (youtubeUrl  !== undefined) pendingData.youtubeUrl  = youtubeUrl || null;
    if (tiktokUrl   !== undefined) pendingData.tiktokUrl   = tiktokUrl  || null;
    if (timeline    !== undefined) pendingData.timeline    = timeline;

    // ลบ PendingEdit เก่าทุกสถานะ (PENDING + REJECTED) ก่อนสร้างใหม่
    await (prisma as any).pendingEdit.deleteMany({
      where: { targetId: trip.id, targetType: "TRIP", status: { in: ["PENDING", "REJECTED"] } },
    });

    await (prisma as any).pendingEdit.create({
      data: {
        targetType:    "TRIP",
        targetId:      trip.id,
        originalData,
        pendingData,
        submittedById: session.userId,
      },
    });

    // อัปเดต coverUrl ทันทีให้ profile เห็นรูปใหม่ (content อื่นรออนุมัติ)
    const immediateUpdate: Record<string, any> = {};
    if (coverUrl !== undefined) immediateUpdate.coverUrl = coverUrl;
    if (Object.keys(immediateUpdate).length > 0) {
      await prisma.trip.update({ where: { slug }, data: immediateUpdate });
    }

    return NextResponse.json({ message: "ส่งการแก้ไขสำเร็จ รอการตรวจสอบจากแอดมิน", pending: true });
  } catch (error) {
    console.error("PUT /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── DELETE /api/trips/[slug] ──────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const trip = await prisma.trip.findUnique({ where: { slug }, select: { id: true, title: true, authorId: true } });
    if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });
    if (trip.authorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ลบ" }, { status: 403 });
    }

    await prisma.trip.delete({ where: { slug } });

    await logActivity({
      userId: session.userId, username: session.username,
      action: "DELETE_TRIP",
      ip: getClientIp(req), userAgent: req.headers.get("user-agent"),
      targetId: trip.id, targetType: "TRIP",
      detail: trip.title,
    }).catch(() => {});

    return NextResponse.json({ message: "ลบทริปแล้ว" });
  } catch (error) {
    console.error("DELETE /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

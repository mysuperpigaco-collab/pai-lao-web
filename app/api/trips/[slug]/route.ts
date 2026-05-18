import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { slug: string } };

// ── GET /api/trips/[slug] ─────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { slug: params.slug },
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

    // คำนวณ rating เฉลี่ย
    const avgRating = trip.reviews.length
      ? trip.reviews.reduce((sum, r) => sum + r.rating, 0) / trip.reviews.length
      : 0;

    return NextResponse.json({ trip: { ...trip, avgRating: Math.round(avgRating * 10) / 10 } });
  } catch (error) {
    console.error("GET /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── PUT /api/trips/[slug] — แก้ไขทริป ────────────────────
export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const trip = await prisma.trip.findUnique({ where: { slug: params.slug }, select: { authorId: true } });
    if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });
    if (trip.authorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์แก้ไข" }, { status: 403 });
    }

    const body = await request.json();
    const { title, subtitle, description, coverUrl, gallery, mood, budget, location, tags, isPublished, timeline } = body;

    // ถ้ามี timeline ส่งมา ลบอันเก่าแล้ว insert ใหม่ทั้งหมด
    if (timeline) {
      await prisma.timelineStop.deleteMany({ where: { trip: { slug: params.slug } } });
    }

    const updated = await prisma.trip.update({
      where: { slug: params.slug },
      data: {
        ...(title       !== undefined && { title }),
        ...(subtitle    !== undefined && { subtitle }),
        ...(description !== undefined && { description }),
        ...(coverUrl    !== undefined && { coverUrl }),
        ...(gallery     !== undefined && { gallery }),
        ...(mood        !== undefined && { mood }),
        ...(budget      !== undefined && { budget: budget ? Number(budget) : null }),
        ...(location    !== undefined && { location }),
        ...(tags        !== undefined && { tags }),
        ...(isPublished !== undefined && { isPublished }),
        ...(timeline?.length && {
          timeline: {
            create: (timeline as any[]).map((stop: any, index: number) => ({
              order:       index,
              date:        stop.date        ?? "",
              time:        stop.time        ?? "",
              placeName:   stop.place       ?? stop.placeName ?? "",
              province:    stop.province    ?? "",
              district:    stop.district    ?? "",
              description: stop.description ?? "",
              transport:   stop.transport   ?? null,
              duration:    stop.duration    ?? null,
              cost:        stop.cost        ?? null,
              images:      stop.images      ?? (stop.image ? [stop.image] : []),
            })),
          },
        }),
      },
      include: { timeline: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", trip: updated });
  } catch (error) {
    console.error("PUT /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── DELETE /api/trips/[slug] ──────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const trip = await prisma.trip.findUnique({ where: { slug: params.slug }, select: { authorId: true } });
    if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });
    if (trip.authorId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ลบ" }, { status: 403 });
    }

    await prisma.trip.delete({ where: { slug: params.slug } });
    return NextResponse.json({ message: "ลบทริปแล้ว" });
  } catch (error) {
    console.error("DELETE /api/trips/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

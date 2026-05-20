import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/trips?q=&status=&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q       = searchParams.get("q") || "";
  const status  = searchParams.get("status") || ""; // "published" | "draft"
  const page    = parseInt(searchParams.get("page") || "1");
  const limit   = parseInt(searchParams.get("limit") || "20");
  const skip    = (page - 1) * limit;

  const where: any = {};
  if (q) {
    where.OR = [
      { title:    { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { author:   { username: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (status === "published") where.isPublished = true;
  if (status === "draft")     where.isPublished = false;

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, coverUrl: true, mood: true,
        location: true, isPublished: true, viewCount: true, createdAt: true,
        author: { select: { id: true, username: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { likes: true, reviews: true, bookmarks: true } },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return NextResponse.json({ trips, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/trips — publish/unpublish
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { tripId, action } = await request.json();
  if (!tripId) return NextResponse.json({ message: "กรุณาระบุ tripId" }, { status: 400 });

  if (action === "togglePublish") {
    const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { isPublished: true } });
    if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { isPublished: !trip.isPublished },
      select: { id: true, title: true, isPublished: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.userId,
        action: updated.isPublished ? "PUBLISH_TRIP" : "UNPUBLISH_TRIP",
        targetId: tripId,
        targetType: "TRIP",
        detail: `Trip: ${updated.title}`,
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", trip: updated });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

// DELETE /api/admin/trips
export async function DELETE(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { tripId } = await request.json();
  if (!tripId) return NextResponse.json({ message: "กรุณาระบุ tripId" }, { status: 400 });

  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { title: true } });
  if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });

  await prisma.trip.delete({ where: { id: tripId } });

  await prisma.adminLog.create({
    data: {
      adminId: session.userId,
      action: "DELETE_TRIP",
      targetId: tripId,
      targetType: "TRIP",
      detail: `Trip: ${trip.title}`,
    },
  });

  return NextResponse.json({ message: "ลบทริปสำเร็จ" });
}

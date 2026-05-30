import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/trips?q=&approval=&page=&limit=
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q        = searchParams.get("q") || "";
    const approval = searchParams.get("approval") || "";
    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = parseInt(searchParams.get("limit") || "20");
    const skip     = (page - 1) * limit;

    const where: any = {};
    if (q) {
      where.OR = [
        { title:    { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { author:   { username: { contains: q, mode: "insensitive" } } },
      ];
    }
    if (approval) where.approvalStatus = approval;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, slug: true, title: true, coverUrl: true, mood: true,
          location: true, isPublished: true, approvalStatus: true,
          rejectionReason: true, viewCount: true, createdAt: true,
          author: { select: { id: true, username: true, displayName: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { likes: true, reviews: true, bookmarks: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return NextResponse.json({ trips, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/admin/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/admin/trips — approve / reject / togglePublish
export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
    }

    const { tripId, action, rejectionReason } = await request.json();
    if (!tripId) return NextResponse.json({ message: "กรุณาระบุ tripId" }, { status: 400 });

    if (action === "approve") {
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: { approvalStatus: "APPROVED", isPublished: true, rejectionReason: null },
        select: { id: true, title: true, approvalStatus: true },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "APPROVE_TRIP", targetId: tripId, targetType: "TRIP", detail: `Trip: ${updated.title}` },
      });
      return NextResponse.json({ message: "อนุมัติทริปสำเร็จ", trip: updated });
    }

    if (action === "reject") {
      const reason = rejectionReason?.trim() || "ไม่ผ่านเกณฑ์การตรวจสอบ";
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: { approvalStatus: "REJECTED", isPublished: false, rejectionReason: reason },
        select: { id: true, title: true, approvalStatus: true },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: "REJECT_TRIP", targetId: tripId, targetType: "TRIP", detail: `Trip: ${updated.title} | เหตุผล: ${reason}` },
      });
      return NextResponse.json({ message: "ปฏิเสธทริปสำเร็จ", trip: updated });
    }

    if (action === "togglePublish") {
      const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { isPublished: true } });
      if (!trip) return NextResponse.json({ message: "ไม่พบทริป" }, { status: 404 });
      const updated = await prisma.trip.update({
        where: { id: tripId },
        data: { isPublished: !trip.isPublished },
        select: { id: true, title: true, isPublished: true },
      });
      await prisma.adminLog.create({
        data: { adminId: session.userId, action: updated.isPublished ? "PUBLISH_TRIP" : "UNPUBLISH_TRIP", targetId: tripId, targetType: "TRIP", detail: `Trip: ${updated.title}` },
      });
      return NextResponse.json({ message: "อัปเดตสำเร็จ", trip: updated });
    }

    return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("PUT /api/admin/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// DELETE /api/admin/trips
export async function DELETE(request: Request) {
  try {
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
      data: { adminId: session.userId, action: "DELETE_TRIP", targetId: tripId, targetType: "TRIP", detail: `Trip: ${trip.title}` },
    });

    return NextResponse.json({ message: "ลบทริปสำเร็จ" });
  } catch (error) {
    console.error("DELETE /api/admin/trips:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

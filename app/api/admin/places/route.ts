import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/places?approval=PENDING|APPROVED|REJECTED&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const approval = searchParams.get("approval") || "PENDING";
  const page     = parseInt(searchParams.get("page")  || "1");
  const limit    = parseInt(searchParams.get("limit") || "20");
  const skip     = (page - 1) * limit;

  const where: any = approval ? { approvalStatus: approval } : {};

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, coverUrl: true,
        province: true, district: true, category: true,
        approvalStatus: true, rejectionReason: true, createdAt: true,
        description: true, openHours: true, closedDays: true,
        entryFee: true, phone: true, website: true,
        business: { select: { id: true, businessName: true, userId: true,
          user: { select: { username: true, displayName: true, avatarUrl: true } } } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.place.count({ where }),
  ]);

  return NextResponse.json({ places, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/places — approve | reject
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { placeId, action, rejectionReason } = await request.json();
  if (!placeId || !action) return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });

  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { title: true } });
  if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

  if (action === "approve") {
    await prisma.place.update({
      where: { id: placeId },
      data: { approvalStatus: "APPROVED", rejectionReason: null },
    });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "APPROVE_PLACE",
      targetId: placeId, targetType: "PLACE",
      detail: `Place: ${place.title}`,
    }});
    return NextResponse.json({ message: "อนุมัติสถานที่สำเร็จ" });
  }

  if (action === "reject") {
    const reason = rejectionReason?.trim() || "ไม่ผ่านเกณฑ์การตรวจสอบ";
    await prisma.place.update({
      where: { id: placeId },
      data: { approvalStatus: "REJECTED", rejectionReason: reason },
    });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "REJECT_PLACE",
      targetId: placeId, targetType: "PLACE",
      detail: `Place: ${place.title} | เหตุผล: ${reason}`,
    }});
    return NextResponse.json({ message: "ปฏิเสธสถานที่แล้ว" });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

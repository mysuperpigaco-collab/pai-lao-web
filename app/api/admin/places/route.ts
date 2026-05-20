import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/places?q=&category=&province=&verified=&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const province = searchParams.get("province") || "";
  const verified = searchParams.get("verified") || "";
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = parseInt(searchParams.get("limit") || "20");
  const skip     = (page - 1) * limit;

  const where: any = {};
  if (q) {
    where.OR = [
      { title:    { contains: q, mode: "insensitive" } },
      { province: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category) where.category = category;
  if (province) where.province = province;
  if (verified === "true")  where.isVerified = true;
  if (verified === "false") where.isVerified = false;

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, coverUrl: true, category: true,
        province: true, district: true, isVerified: true, viewCount: true, createdAt: true,
        business: { select: { businessName: true, user: { select: { username: true } } } },
        _count: { select: { reviews: true, likes: true, bookmarks: true } },
      },
    }),
    prisma.place.count({ where }),
  ]);

  return NextResponse.json({ places, total, page, pages: Math.ceil(total / limit) });
}

// PUT /api/admin/places — verify/unverify
export async function PUT(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { placeId, action } = await request.json();
  if (!placeId) return NextResponse.json({ message: "กรุณาระบุ placeId" }, { status: 400 });

  if (action === "toggleVerify") {
    const place = await prisma.place.findUnique({ where: { id: placeId }, select: { isVerified: true, title: true } });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

    const updated = await prisma.place.update({
      where: { id: placeId },
      data: { isVerified: !place.isVerified },
      select: { id: true, title: true, isVerified: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.userId,
        action: updated.isVerified ? "VERIFY_PLACE" : "UNVERIFY_PLACE",
        targetId: placeId,
        targetType: "PLACE",
        detail: `Place: ${updated.title}`,
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", place: updated });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

// DELETE /api/admin/places
export async function DELETE(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { placeId } = await request.json();
  if (!placeId) return NextResponse.json({ message: "กรุณาระบุ placeId" }, { status: 400 });

  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { title: true } });
  if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

  await prisma.place.delete({ where: { id: placeId } });

  await prisma.adminLog.create({
    data: {
      adminId: session.userId,
      action: "DELETE_PLACE",
      targetId: placeId,
      targetType: "PLACE",
      detail: `Place: ${place.title}`,
    },
  });

  return NextResponse.json({ message: "ลบสถานที่สำเร็จ" });
}

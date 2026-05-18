import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ slug: string }> };

// ── GET /api/places/[slug] ────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const place = await prisma.place.findUnique({
      where: { slug },
      include: {
        business: {
          select: { id: true, businessName: true, logoUrl: true, coverUrl: true,
                    description: true, website: true, phone: true, isVerified: true },
        },
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

    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่นี้" }, { status: 404 });

    const avgRating = place.reviews.length
      ? place.reviews.reduce((sum, r) => sum + r.rating, 0) / place.reviews.length
      : 0;

    return NextResponse.json({ place: { ...place, avgRating: Math.round(avgRating * 10) / 10 } });
  } catch (error) {
    console.error("GET /api/places/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── PUT /api/places/[slug] — แก้ไข ───────────────────────
export async function PUT(request: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const place = await prisma.place.findUnique({
      where: { slug },
      select: { business: { select: { userId: true } } },
    });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });
    if (place.business?.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์แก้ไข" }, { status: 403 });
    }

    const body = await request.json();
    const { title, titleEn, province, district, address, googleMapsUrl, lat, lng,
            category, tags, coverUrl, gallery, description, descriptionShort,
            openHours, closedDays, entryFee, phone, website, lineId } = body;

    const updated = await prisma.place.update({
      where: { slug },
      data: {
        ...(title            !== undefined && { title }),
        ...(titleEn          !== undefined && { titleEn }),
        ...(province         !== undefined && { province }),
        ...(district         !== undefined && { district }),
        ...(address          !== undefined && { address }),
        ...(googleMapsUrl    !== undefined && { googleMapsUrl }),
        ...(lat              !== undefined && { lat: lat ? Number(lat) : null }),
        ...(lng              !== undefined && { lng: lng ? Number(lng) : null }),
        ...(category         !== undefined && { category }),
        ...(tags             !== undefined && { tags }),
        ...(coverUrl         !== undefined && { coverUrl }),
        ...(gallery          !== undefined && { gallery }),
        ...(description      !== undefined && { description }),
        ...(descriptionShort !== undefined && { descriptionShort }),
        ...(openHours        !== undefined && { openHours }),
        ...(closedDays       !== undefined && { closedDays }),
        ...(entryFee         !== undefined && { entryFee }),
        ...(phone            !== undefined && { phone }),
        ...(website          !== undefined && { website }),
        ...(lineId           !== undefined && { lineId }),
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", place: updated });
  } catch (error) {
    console.error("PUT /api/places/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── DELETE /api/places/[slug] ─────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const place = await prisma.place.findUnique({
      where: { slug },
      select: { business: { select: { userId: true } } },
    });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });
    if (place.business?.userId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ลบ" }, { status: 403 });
    }

    await prisma.place.delete({ where: { slug } });
    return NextResponse.json({ message: "ลบสถานที่แล้ว" });
  } catch (error) {
    console.error("DELETE /api/places/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

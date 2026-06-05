import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: Promise<{ slug: string }> };

// ── GET /api/places/[slug] ────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
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

// ── PUT /api/places/[slug] — แก้ไข (ต้องรอ admin อนุมัติ) ───
export async function PUT(request: Request, { params }: Params) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const place = await prisma.place.findUnique({
      where: { slug },
      select: {
        id: true, title: true, titleEn: true, province: true, district: true,
        address: true, googleMapsUrl: true, category: true, tags: true,
        coverUrl: true, gallery: true, description: true, descriptionShort: true,
        openHours: true, closedDays: true, entryFee: true, phone: true,
        website: true, lineId: true, amenities: true, petPolicy: true, approvalStatus: true,
        business: { select: { userId: true } },
      },
    });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

    const isOwner = place.business?.userId === session.userId;
    const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์แก้ไข" }, { status: 403 });
    }

    const body = await request.json();
    const { title, titleEn, province, district, address, googleMapsUrl, lat, lng,
            category: categoryRaw, tags, coverUrl, gallery, description, descriptionShort,
            openHours, closedDays, entryFee, phone, website, lineId,
            amenities, petPolicy } = body;

    const CATEGORY_MAP: Record<string, string> = {
      "ธรรมชาติ": "NATURE", "คาเฟ่": "CAFE", "ที่พัก": "ACCOMMODATION",
      "แคมปิ้ง": "CAMPING", "อาหาร": "FOOD", "วัด / ศาสนสถาน": "TEMPLE",
      "ชายหาด": "BEACH", "ตลาด / ช้อปปิ้ง": "MARKET",
      "กีฬา / ผจญภัย": "ADVENTURE", "พิพิธภัณฑ์ / ประวัติศาสตร์": "MUSEUM",
    };
    const category = categoryRaw !== undefined
      ? (CATEGORY_MAP[categoryRaw] ?? categoryRaw) as any
      : undefined;

    // ── แอดมินแก้ไขตรง (ไม่ต้องรออนุมัติ) ──────────────────
    if (isAdmin) {
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
          ...(amenities        !== undefined && { amenities }),
          ...(petPolicy        !== undefined && { petPolicy }),
        },
      });
      return NextResponse.json({ message: "อัปเดตสำเร็จ", place: updated });
    }

    // ── เจ้าของ: สร้าง PendingEdit รอตรวจสอบ ───────────────
    // Original snapshot
    const originalData = {
      title: place.title, titleEn: place.titleEn,
      province: place.province, district: place.district,
      address: place.address, googleMapsUrl: place.googleMapsUrl,
      category: place.category, tags: place.tags,
      coverUrl: place.coverUrl, gallery: place.gallery,
      description: place.description, descriptionShort: place.descriptionShort,
      openHours: place.openHours, closedDays: place.closedDays,
      entryFee: place.entryFee, phone: place.phone,
      website: place.website, lineId: place.lineId,
      amenities: place.amenities, petPolicy: place.petPolicy,
    };

    const pendingData: Record<string, any> = {};
    if (title            !== undefined) pendingData.title            = title;
    if (titleEn          !== undefined) pendingData.titleEn          = titleEn;
    if (province         !== undefined) pendingData.province         = province;
    if (district         !== undefined) pendingData.district         = district;
    if (address          !== undefined) pendingData.address          = address;
    if (googleMapsUrl    !== undefined) pendingData.googleMapsUrl    = googleMapsUrl;
    if (lat              !== undefined) pendingData.lat              = lat ? Number(lat) : null;
    if (lng              !== undefined) pendingData.lng              = lng ? Number(lng) : null;
    if (category         !== undefined) pendingData.category         = category;
    if (tags             !== undefined) pendingData.tags             = tags;
    if (coverUrl         !== undefined) pendingData.coverUrl         = coverUrl;
    if (gallery          !== undefined) pendingData.gallery          = gallery;
    if (description      !== undefined) pendingData.description      = description;
    if (descriptionShort !== undefined) pendingData.descriptionShort = descriptionShort;
    if (openHours        !== undefined) pendingData.openHours        = openHours;
    if (closedDays       !== undefined) pendingData.closedDays       = closedDays;
    if (entryFee         !== undefined) pendingData.entryFee         = entryFee;
    if (phone            !== undefined) pendingData.phone            = phone;
    if (website          !== undefined) pendingData.website          = website;
    if (lineId           !== undefined) pendingData.lineId           = lineId;
    if (amenities        !== undefined) pendingData.amenities        = amenities;
    if (petPolicy        !== undefined) pendingData.petPolicy        = petPolicy;

    // ลบ PendingEdit เก่าทุกสถานะ (PENDING + REJECTED) ก่อนสร้างใหม่
    await (prisma as any).pendingEdit.deleteMany({
      where: { targetId: place.id, targetType: "PLACE", status: { in: ["PENDING", "REJECTED"] } },
    });

    await (prisma as any).pendingEdit.create({
      data: {
        targetType:    "PLACE",
        targetId:      place.id,
        originalData,
        pendingData,
        submittedById: session.userId,
      },
    });

    return NextResponse.json({ message: "ส่งการแก้ไขสำเร็จ รอการตรวจสอบจากแอดมิน", pending: true });
  } catch (error) {
    console.error("PUT /api/places/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── DELETE /api/places/[slug] ─────────────────────────────
// ADMIN: ลบสถานที่จริงออกจากระบบ
// BUSINESS OWNER: ตัดความเป็นเจ้าของออกเท่านั้น (unclaim) ไม่ลบข้อมูล
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { slug: rawSlug } = await params;
    const slug = decodeURIComponent(rawSlug);
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const place = await prisma.place.findUnique({
      where: { slug },
      select: {
        id: true, businessId: true,
        business: { select: { userId: true, id: true } },
        claims: { where: { status: "APPROVED" }, select: { id: true } },
      },
    });
    if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

    const isAdmin = session.role === "ADMIN" || session.role === "SUPERADMIN";
    const isOwner = place.business?.userId === session.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    if (isAdmin) {
      // แอดมินเท่านั้นที่ลบสถานที่ออกจากระบบได้จริง
      await prisma.place.delete({ where: { slug } });
      return NextResponse.json({ message: "ลบสถานที่ออกจากระบบแล้ว" });
    }

    // เจ้าของ: เช็คว่าสถานที่นี้ถูก claim มาหรือสร้างเอง
    const isClaimedPlace = (place as any).claims?.length > 0;

    if (isClaimedPlace) {
      // สถานที่ที่เคยไม่มีเจ้าของ — ยกเลิกความเป็นเจ้าของได้เท่านั้น ไม่ลบ
      await prisma.place.update({ where: { slug }, data: { businessId: null } });
      return NextResponse.json({ message: "ยกเลิกความเป็นเจ้าของสถานที่แล้ว สถานที่ยังคงอยู่ในระบบ" });
    }

    // สถานที่ที่เจ้าของสร้างเอง — ลบออกจากระบบได้
    await prisma.place.delete({ where: { slug } });
    return NextResponse.json({ message: "ลบสถานที่ออกจากระบบแล้ว" });
  } catch (error) {
    console.error("DELETE /api/places/[slug]:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

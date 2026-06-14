import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { googleUrlToLatLng } from "@/lib/maps";

// GET /api/admin/places?q=&category=&verified=&approval=&page=&limit=
export async function GET(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q        = searchParams.get("q")        || "";
  const category = searchParams.get("category") || "";
  const verified = searchParams.get("verified") || "";
  const approval = searchParams.get("approval") || "";
  const page     = parseInt(searchParams.get("page")  || "1");
  const limit    = parseInt(searchParams.get("limit") || "20");
  const skip     = (page - 1) * limit;

  const where: any = {
    ...(approval ? { approvalStatus: approval } : {}),
    ...(category ? { category } : {}),
    ...(verified === "true"  ? { isVerified: true  } : {}),
    ...(verified === "false" ? { isVerified: false } : {}),
    ...(q ? {
      OR: [
        { title:    { contains: q, mode: "insensitive" } },
        { province: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
      ],
    } : {}),
  };

  const [places, total] = await Promise.all([
    prisma.place.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, slug: true, title: true, coverUrl: true,
        province: true, district: true, category: true,
        approvalStatus: true, rejectionReason: true, createdAt: true,
        isVerified: true, viewCount: true,
        description: true, openHours: true, closedDays: true,
        entryFee: true, phone: true, website: true,
        business: { select: { id: true, businessName: true, userId: true,
          user: { select: { username: true, displayName: true, avatarUrl: true } } } },
        _count: { select: { reviews: true, likes: true } },
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

  if (action === "toggleVerify") {
    const current = await prisma.place.findUnique({ where: { id: placeId }, select: { isVerified: true, title: true } });
    if (!current) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });
    await prisma.place.update({ where: { id: placeId }, data: { isVerified: !current.isVerified } });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: current.isVerified ? "UNVERIFY_PLACE" : "VERIFY_PLACE",
      targetId: placeId, targetType: "PLACE",
      detail: `Place: ${current.title}`,
    }});
    return NextResponse.json({ message: current.isVerified ? "ยกเลิกการยืนยันแล้ว" : "ยืนยันสถานที่แล้ว" });
  }

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

  if (action === "hide") {
    await prisma.place.update({
      where: { id: placeId },
      data: { approvalStatus: "REJECTED", rejectionReason: rejectionReason?.trim() || "ซ้ำกับสถานที่อื่น" },
    });
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "HIDE_PLACE",
      targetId: placeId, targetType: "PLACE",
      detail: `Hidden: ${place.title}`,
    }});
    return NextResponse.json({ message: "ซ่อนสถานที่สำเร็จ" });
  }

  if (action === "revoke-ownership") {
    const fullPlace = await prisma.place.findUnique({ where: { id: placeId }, select: { businessId: true, title: true } });
    if (!fullPlace?.businessId) return NextResponse.json({ message: "สถานที่นี้ไม่มีเจ้าของอยู่แล้ว" }, { status: 400 });
    await prisma.place.update({ where: { id: placeId }, data: { businessId: null } });
    // Also reject any pending claims for this place
    await (prisma as any).placeClaim.updateMany({
      where: { placeId, status: "PENDING" },
      data: { status: "REJECTED", adminNote: "แอดมินยกเลิกความเป็นเจ้าของ" },
    }).catch(() => {});
    await prisma.adminLog.create({ data: {
      adminId: session.userId, action: "REVOKE_OWNERSHIP",
      targetId: placeId, targetType: "PLACE",
      detail: `Revoked ownership of: ${fullPlace.title}`,
    }});
    return NextResponse.json({ message: "ยกเลิกความเป็นเจ้าของสำเร็จ" });
  }

  return NextResponse.json({ message: "action ไม่ถูกต้อง" }, { status: 400 });
}

// DELETE /api/admin/places?placeId=xxx — ลบสถานที่ถาวร (cascade)
export async function DELETE(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN"))
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  if (!placeId) return NextResponse.json({ message: "ต้องระบุ placeId" }, { status: 400 });

  const place = await prisma.place.findUnique({ where: { id: placeId }, select: { title: true } });
  if (!place) return NextResponse.json({ message: "ไม่พบสถานที่" }, { status: 404 });

  await prisma.place.delete({ where: { id: placeId } });
  await prisma.adminLog.create({ data: {
    adminId: session.userId, action: "DELETE_PLACE",
    targetId: placeId, targetType: "PLACE",
    detail: `Deleted: ${place.title}`,
  }});

  return NextResponse.json({ message: `ลบ "${place.title}" สำเร็จ` });
}

// POST /api/admin/places — admin สร้างสถานที่โดยตรง (APPROVED + verified ทันที)
export async function POST(request: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      title, titleEn, province, district, address, googleMapsUrl,
      category: categoryRaw, tags, coverUrl, gallery,
      description, descriptionShort, openHours, closedDays,
      entryFee, phone, website, lineId,
    } = body;

    // Auto-extract lat/lng from Google Maps URL if not explicitly provided
    let resolvedLat: number | null = body.lat ? Number(body.lat) : null;
    let resolvedLng: number | null = body.lng ? Number(body.lng) : null;
    if ((resolvedLat == null || resolvedLng == null) && googleMapsUrl) {
      const c = await googleUrlToLatLng(googleMapsUrl);
      if (c) { resolvedLat = c.lat; resolvedLng = c.lng; }
    }

    if (!title || !province || !district || !categoryRaw || !description) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ (ชื่อ, จังหวัด, อำเภอ, หมวดหมู่, คำอธิบาย)" }, { status: 400 });
    }

    const CATEGORY_MAP: Record<string, string> = {
      "ธรรมชาติ": "NATURE", "คาเฟ่": "CAFE", "ที่พัก": "ACCOMMODATION",
      "แคมปิ้ง": "CAMPING", "อาหาร": "FOOD", "วัด / ศาสนสถาน": "TEMPLE",
      "ชายหาด": "BEACH", "ตลาด / ช้อปปิ้ง": "MARKET",
      "กีฬา / ผจญภัย": "ADVENTURE", "พิพิธภัณฑ์ / ประวัติศาสตร์": "MUSEUM",
    };
    const category = (CATEGORY_MAP[categoryRaw] ?? categoryRaw) as any;

    const slug = `${title.replace(/[^a-zA-Z0-9ก-๙]/g, "-").replace(/-+/g, "-").toLowerCase()}-${Date.now()}`;

    const place = await prisma.place.create({
      data: {
        slug, title,
        titleEn:          titleEn          ?? null,
        province, district,
        address:          address          ?? null,
        googleMapsUrl:    googleMapsUrl    ?? null,
        lat:              resolvedLat,
        lng:              resolvedLng,
        category,
        tags:             tags             ?? [],
        coverUrl:         coverUrl         ?? "",
        gallery:          gallery          ?? [],
        description,
        descriptionShort: descriptionShort ?? null,
        openHours:        openHours        ?? null,
        closedDays:       closedDays       ?? null,
        entryFee:         entryFee         ?? null,
        phone:            phone            ?? null,
        website:          website          ?? null,
        lineId:           lineId           ?? null,
        approvalStatus:   "APPROVED",
        isVerified:       true,
        businessId:       null,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId:    session.userId,
        action:     "CREATE_PLACE",
        targetId:   place.id,
        targetType: "PLACE",
        detail:     `Admin created place: ${title}`,
      },
    });

    return NextResponse.json({ message: "เพิ่มสถานที่สำเร็จ", place }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/places:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

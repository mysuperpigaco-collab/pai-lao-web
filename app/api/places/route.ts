import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// ── GET /api/places ───────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Number(searchParams.get("page")     ?? 1);
    const limit    = Number(searchParams.get("limit")    ?? 12);
    const category = searchParams.get("category")        ?? undefined;
    const province = searchParams.get("province")        ?? undefined;
    const q        = searchParams.get("q")               ?? undefined;
    const skip     = (page - 1) * limit;

    const where: any = {
      ...(category ? { category: category as any } : {}),
      ...(province ? { province }                 : {}),
      ...(q        ? { OR: [
        { title:       { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { province:    { contains: q, mode: "insensitive" } },
      ]} : {}),
    };

    const [places, total] = await Promise.all([
      prisma.place.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, slug: true, title: true, titleEn: true,
          province: true, district: true, category: true, tags: true,
          coverUrl: true, descriptionShort: true, entryFee: true,
          isVerified: true, createdAt: true,
          business: { select: { id: true, businessName: true, logoUrl: true } },
          _count: { select: { reviews: true, bookmarks: true } },
        },
      }),
      prisma.place.count({ where }),
    ]);

    return NextResponse.json({ places, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/places:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ── POST /api/places — สร้างสถานที่ใหม่ (Business เท่านั้น) ─
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS" && session.role !== "ADMIN") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const body = await request.json();
    const { title, titleEn, province, district, address, googleMapsUrl, lat, lng,
            category, tags, coverUrl, gallery, description, descriptionShort,
            openHours, closedDays, entryFee, phone, website, lineId } = body;

    if (!title || !province || !district || !category || !coverUrl || !description) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" }, { status: 400 });
    }

    // หา business ของ user นี้
    const business = await prisma.business.findUnique({ where: { userId: session.userId } });
    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    const slug = `${title.replace(/[^a-zA-Z0-9ก-๙]/g, "-").replace(/-+/g, "-").toLowerCase()}-${Date.now()}`;

    const place = await prisma.place.create({
      data: {
        slug, title, titleEn: titleEn ?? null,
        province, district,
        address:          address          ?? null,
        googleMapsUrl:    googleMapsUrl    ?? null,
        lat:              lat              ? Number(lat) : null,
        lng:              lng              ? Number(lng) : null,
        category,
        tags:             tags             ?? [],
        coverUrl,
        gallery:          gallery          ?? [],
        description,
        descriptionShort: descriptionShort ?? null,
        openHours:        openHours        ?? null,
        closedDays:       closedDays       ?? null,
        entryFee:         entryFee         ?? null,
        phone:            phone            ?? null,
        website:          website          ?? null,
        lineId:           lineId           ?? null,
        businessId:       business.id,
      },
    });

    return NextResponse.json({ message: "เพิ่มสถานที่สำเร็จ", place }, { status: 201 });
  } catch (error) {
    console.error("POST /api/places:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

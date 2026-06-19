import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { googleUrlToLatLng, googleMapsPoint } from "@/lib/maps";

// ── GET /api/places ───────────────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Number(searchParams.get("page")     ?? 1);
    const limit    = Number(searchParams.get("limit")    ?? 12);
    const category = searchParams.get("category")        ?? undefined;
    const province = searchParams.get("province")        ?? undefined;
    const district = searchParams.get("district")        ?? undefined;
    const sort     = searchParams.get("sort")            ?? "recent";
    const q        = searchParams.get("q")               ?? undefined;
    const skip     = (page - 1) * limit;

    const where: any = {
      approvalStatus: "APPROVED",
      ...(category ? { category: category as any }                              : {}),
      ...(province ? { province: { contains: province, mode: "insensitive" } } : {}),
      ...(district ? { district: { contains: district, mode: "insensitive" } } : {}),
      ...(q        ? { OR: [
        { title:       { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { province:    { contains: q, mode: "insensitive" } },
      ]} : {}),
    };

    const select = {
      id: true, slug: true, title: true, titleEn: true,
      province: true, district: true, category: true, tags: true,
      coverUrl: true, descriptionShort: true, entryFee: true,
      lat: true, lng: true,
      isVerified: true, createdAt: true, shareCount: true,
      business: { select: { id: true, businessName: true, logoUrl: true, isVerified: true } },
      _count: { select: { reviews: true, bookmarks: true, likes: true } },
      reviews: { select: { rating: true } },
    };

    let places;
    if (sort === "popular") {
      // Weighted score: bookmark×3 + like×1 — Prisma can't do formula orderBy so sort in JS
      const all = await prisma.place.findMany({ where, select });
      all.sort((a, b) => {
        const sa = a._count.bookmarks * 3 + a._count.likes;
        const sb = b._count.bookmarks * 3 + b._count.likes;
        if (sb !== sa) return sb - sa;
        return b.id > a.id ? 1 : b.id < a.id ? -1 : 0; // tie-break: id desc
      });
      places = all.slice(skip, skip + limit);
    } else if (sort === "alpha") {
      places = await prisma.place.findMany({
        where, skip, take: limit,
        orderBy: { title: "asc" },
        select,
      });
    } else {
      places = await prisma.place.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select,
      });
    }

    const total = await prisma.place.count({ where });

    // Compute avgRating per place
    const placesWithAvg = places.map(p => {
      const ratings = (p.reviews ?? []).map((r: { rating: number }) => r.rating);
      const avgRating = ratings.length ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : null;
      const { reviews: _r, ...rest } = p;
      return { ...rest, avgRating };
    });

    // Fetch community cover photos (first reviewer image per place)
    const placeIds = placesWithAvg.map(p => p.id);
    const placeTitles = placesWithAvg.map(p => p.title.toLowerCase());

    const communityStops = await prisma.timelineStop.findMany({
      where: {
        OR: [
          { placeId: { in: placeIds } },
          { placeId: null, placeName: { in: placeTitles, mode: "insensitive" } },
        ],
      },
      select: { placeId: true, placeName: true, images: true },
      orderBy: { id: "desc" },
    });

    // Build maps: placeId → first image, placeName(lower) → first image
    const coverByPlaceId: Record<string, string> = {};
    const coverByName: Record<string, string> = {};
    for (const stop of communityStops) {
      if (stop.images.length === 0) continue;
      if (stop.placeId && !coverByPlaceId[stop.placeId]) {
        coverByPlaceId[stop.placeId] = stop.images[0];
      }
      if (!stop.placeId && stop.placeName && !coverByName[stop.placeName.toLowerCase()]) {
        coverByName[stop.placeName.toLowerCase()] = stop.images[0];
      }
    }

    // นับ pending claims ของแต่ละสถานที่ที่ไม่มีเจ้าของ (สำหรับแสดงในหน้า claim)
    const unownedIds = placesWithAvg.filter(p => !p.business).map(p => p.id);
    const pendingClaimCounts: Record<string, number> = {};
    if (unownedIds.length > 0) {
      const claimCounts = await (prisma as any).placeClaim.groupBy({
        by: ["placeId"],
        where: { placeId: { in: unownedIds }, status: "PENDING" },
        _count: { placeId: true },
      });
      for (const c of claimCounts) {
        pendingClaimCounts[c.placeId] = c._count.placeId;
      }
    }

    const placesWithCover = placesWithAvg.map(p => ({
      ...p,
      communityCover: coverByPlaceId[p.id] ?? coverByName[p.title.toLowerCase()] ?? null,
      pendingClaimCount: pendingClaimCounts[p.id] ?? 0,
    }));

    return NextResponse.json({ places: placesWithCover, total, page, totalPages: Math.ceil(total / limit) });
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

    const userCheck = await prisma.user.findUnique({ where: { id: session.userId }, select: { postBannedUntil: true, bannedUntil: true } });
    const now = new Date();
    if (userCheck?.bannedUntil && userCheck.bannedUntil > now) {
      return NextResponse.json({ message: "บัญชีของคุณถูกระงับ ไม่สามารถดำเนินการได้" }, { status: 403 });
    }
    if (userCheck?.postBannedUntil && userCheck.postBannedUntil > now) {
      return NextResponse.json({ message: "คุณถูกจำกัดการสร้างเนื้อหา ไม่สามารถเพิ่มสถานที่ได้" }, { status: 403 });
    }

    const body = await request.json();
    const { title, titleEn, province, district, address, googleMapsUrl,
            category: categoryRaw, tags, coverUrl, gallery, description, descriptionShort,
            openHours, closedDays, entryFee, phone, website, lineId,
            amenities, petPolicy } = body;

    if (!title || !province || !district || !categoryRaw || !coverUrl || !description) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบ" }, { status: 400 });
    }

    // Map Thai UI labels → Prisma PlaceCategory enum
    const CATEGORY_MAP: Record<string, string> = {
      "ธรรมชาติ": "NATURE",
      "คาเฟ่": "CAFE",
      "ที่พัก": "ACCOMMODATION",
      "แคมปิ้ง": "CAMPING",
      "อาหาร": "FOOD",
      "วัด / ศาสนสถาน": "TEMPLE",
      "ชายหาด": "BEACH",
      "ตลาด / ช้อปปิ้ง": "MARKET",
      "กีฬา / ผจญภัย": "ADVENTURE",
      "พิพิธภัณฑ์ / ประวัติศาสตร์": "MUSEUM",
    };
    const category = (CATEGORY_MAP[categoryRaw] ?? categoryRaw) as any;

    // หา business ของ user นี้ — ถ้าไม่มีให้สร้างอัตโนมัติ (กรณี account เก่า)
    let business = await prisma.business.findUnique({ where: { userId: session.userId } });
    if (!business) {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      });
      if (!user) return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
      business = await prisma.business.create({
        data: {
          userId:      session.userId,
          businessName: `ธุรกิจของ ${user.firstName} ${user.lastName}`,
          contactName: `${user.firstName} ${user.lastName}`,
          email:       user.email ?? undefined,
          phone:       user.phone ?? undefined,
        },
      });
    }

    // Auto-extract lat/lng from Google Maps URL if not explicitly provided
    let resolvedLat: number | null = body.lat ? Number(body.lat) : null;
    let resolvedLng: number | null = body.lng ? Number(body.lng) : null;
    if ((resolvedLat == null || resolvedLng == null) && googleMapsUrl) {
      const c = await googleUrlToLatLng(googleMapsUrl);
      if (c) { resolvedLat = c.lat; resolvedLng = c.lng; }
    }
    // B.5: if coords set but no URL → generate URL from coords
    let resolvedGoogleMapsUrl = googleMapsUrl ?? null;
    if (resolvedLat != null && resolvedLng != null && !resolvedGoogleMapsUrl) {
      resolvedGoogleMapsUrl = googleMapsPoint(resolvedLat, resolvedLng);
    }

    const slug = `${title.replace(/[^a-zA-Z0-9ก-๙]/g, "-").replace(/-+/g, "-").toLowerCase()}-${Date.now()}`;

    const place = await prisma.place.create({
      data: {
        slug, title, titleEn: titleEn ?? null,
        province, district,
        address:          address          ?? null,
        googleMapsUrl:    resolvedGoogleMapsUrl,
        lat:              resolvedLat,
        lng:              resolvedLng,
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
        amenities:        amenities        ?? [],
        petPolicy:        petPolicy        ?? null,
        businessId:       business.id,
        approvalStatus:   "PENDING",
      },
    });

    return NextResponse.json({ message: "เพิ่มสถานที่สำเร็จ รอการตรวจสอบจากแอดมิน", place, pending: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/places:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

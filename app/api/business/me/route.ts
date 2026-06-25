import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

// GET /api/business/me
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS" && session.role !== "ADMIN") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const business = await prisma.business.findUnique({
      where: { userId: session.userId },
      include: {
        places: {
          orderBy: { createdAt: "desc" },
          include: {
            _count: { select: { reviews: true, bookmarks: true } },
            reviews: { select: { rating: true } },
            claims: { where: { status: "APPROVED" }, select: { id: true, businessId: true } },
          },
        },
      },
    });

    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    // ดึง pending/rejected edits ของทุก place ในธุรกิจนี้
    const placeIds = business.places.map(p => p.id);
    // map: placeId → { status, rejectionReason } (เอาอันล่าสุด)
    const editStatusMap = new Map<string, { status: string; reason: string | null }>();
    if (placeIds.length > 0) {
      const edits = await (prisma as any).pendingEdit.findMany({
        where: { targetType: "PLACE", targetId: { in: placeIds }, status: { in: ["PENDING", "REJECTED"] } },
        select: { targetId: true, status: true, rejectionReason: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      });
      for (const e of edits) {
        if (!editStatusMap.has(e.targetId)) {
          editStatusMap.set(e.targetId, { status: e.status, reason: e.rejectionReason ?? null });
        }
      }
    }

    const placesWithStats = business.places.map(p => {
      const avgRating = p.reviews.length
        ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
        : null;
      return {
        id: p.id, slug: p.slug, title: p.title, titleEn: p.titleEn,
        province: p.province, district: p.district, category: p.category,
        coverUrl: p.coverUrl, isVerified: p.isVerified, avgRating,
        reviewCount: p._count.reviews, bookmarkCount: p._count.bookmarks, createdAt: p.createdAt,
        approvalStatus: p.approvalStatus ?? "PENDING",
        rejectionReason: p.rejectionReason ?? null,
        claimStatus: null as string | null,
        isClaimedPlace: (p as any).claims?.some((c: any) => c.businessId === business.id),
        editStatus: editStatusMap.get(p.id)?.status ?? null,
        editRejectionReason: editStatusMap.get(p.id)?.reason ?? null,
      };
    });

    // ดึง pending/rejected claims ที่ยังไม่ได้รับการอนุมัติ (businessId ยังเป็น null)
    const pendingClaims = await (prisma as any).placeClaim.findMany({
      where: { businessId: business.id, status: { in: ["PENDING", "REJECTED"] } },
      include: {
        place: {
          include: {
            _count: { select: { reviews: true, bookmarks: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const claimPlaces = pendingClaims.map((c: any) => {
      const p = c.place;
      const avgRating = p.reviews?.length
        ? Math.round((p.reviews.reduce((s: number, r: any) => s + r.rating, 0) / p.reviews.length) * 10) / 10
        : null;
      return {
        id: p.id, slug: p.slug, title: p.title, titleEn: p.titleEn,
        province: p.province, district: p.district, category: p.category,
        coverUrl: p.coverUrl, isVerified: p.isVerified, avgRating,
        reviewCount: p._count?.reviews ?? 0, bookmarkCount: p._count?.bookmarks ?? 0,
        createdAt: p.createdAt,
        approvalStatus: p.approvalStatus ?? "APPROVED",
        rejectionReason: p.rejectionReason ?? null,
        claimStatus: c.status as string,   // "PENDING" | "REJECTED"
        claimNote: c.adminNote ?? null,
        isClaimedPlace: true,
      };
    });

    const totalReviews = placesWithStats.reduce((s, p) => s + p.reviewCount, 0);
    const allRatings   = business.places.flatMap(p => p.reviews.map(r => r.rating));
    const overallAvg   = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10
      : null;

    return NextResponse.json({
      business: {
        id:           business.id,
        businessName: business.businessName,
        contactName:  business.contactName,
        logoUrl:      business.logoUrl,
        coverUrl:     business.coverUrl,
        description:  business.description,
        phone:        business.phone,
        email:        business.email,
        website:      business.website,
        province:     business.province,
        district:     business.district,
        country:      business.country,
        lineId:       business.lineId,
        facebook:     business.facebook,
        instagram:    business.instagram,
        tiktok:       business.tiktok,
        categories:   business.categories,
        isVerified:   business.isVerified,
      },
      places: [...placesWithStats, ...claimPlaces],
      stats: { totalPlaces: placesWithStats.length, totalReviews, overallAvg },
    });
  } catch (error) {
    console.error("GET /api/business/me:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// PUT /api/business/me
export async function PUT(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    if (session.role !== "BUSINESS" && session.role !== "ADMIN") {
      return NextResponse.json({ message: "เฉพาะเจ้าของธุรกิจเท่านั้น" }, { status: 403 });
    }

    const body = await request.json();
    const {
      businessName, contactName, description, province, district, country,
      website, logoUrl, coverUrl, phone, email,
      lineId, facebook, instagram, tiktok, categories,
      currentPw, newPw,
    } = body;

    if (newPw) {
      if (!currentPw) return NextResponse.json({ message: "กรุณากรอกรหัสผ่านปัจจุบัน" }, { status: 400 });
      const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { password: true } });
      if (!user) return NextResponse.json({ message: "ไม่พบผู้ใช้" }, { status: 404 });
      if (!user.password) return NextResponse.json({ message: "บัญชีนี้เข้าสู่ระบบด้วย Google ยังไม่มีรหัสผ่าน" }, { status: 400 });
      const ok = await verifyPassword(currentPw, user.password);
      if (!ok) return NextResponse.json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
      await prisma.user.update({ where: { id: session.userId }, data: { password: await hashPassword(newPw) } });
    }

    const updated = await prisma.business.update({
      where: { userId: session.userId },
      data: {
        ...(businessName !== undefined && { businessName }),
        ...(contactName  !== undefined && { contactName }),
        ...(description  !== undefined && { description }),
        ...(province     !== undefined && { province }),
        ...(district     !== undefined && { district }),
        ...(country      !== undefined && { country }),
        ...(website      !== undefined && { website }),
        ...(logoUrl      !== undefined && { logoUrl }),
        ...(coverUrl     !== undefined && { coverUrl }),
        ...(phone        !== undefined && { phone }),
        ...(email        !== undefined && { email }),
        ...(lineId       !== undefined && { lineId }),
        ...(facebook     !== undefined && { facebook }),
        ...(instagram    !== undefined && { instagram }),
        ...(tiktok       !== undefined && { tiktok }),
        ...(categories   !== undefined && { categories }),
      },
    });

    return NextResponse.json({ message: "อัปเดตสำเร็จ", business: updated });
  } catch (error) {
    console.error("PUT /api/business/me:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/business/me — ดึงข้อมูล Business + สถานที่ของ user ที่ login
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
          },
        },
      },
    });

    if (!business) return NextResponse.json({ message: "ไม่พบข้อมูลธุรกิจ" }, { status: 404 });

    // คำนวณ avgRating ต่อ place
    const placesWithStats = business.places.map(p => {
      const avgRating = p.reviews.length
        ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
        : null;
      return {
        id:               p.id,
        slug:             p.slug,
        title:            p.title,
        titleEn:          p.titleEn,
        province:         p.province,
        district:         p.district,
        category:         p.category,
        coverUrl:         p.coverUrl,
        isVerified:       p.isVerified,
        avgRating,
        reviewCount:      p._count.reviews,
        bookmarkCount:    p._count.bookmarks,
        createdAt:        p.createdAt,
      };
    });

    // สรุปสถิติรวม
    const totalReviews  = placesWithStats.reduce((s, p) => s + p.reviewCount,   0);
    const allRatings    = business.places.flatMap(p => p.reviews.map(r => r.rating));
    const overallAvg    = allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r, 0) / allRatings.length) * 10) / 10
      : null;

    return NextResponse.json({
      business: {
        id:           business.id,
        businessName: business.businessName,
        logoUrl:      business.logoUrl,
        coverUrl:     business.coverUrl,
        description:  business.description,
        phone:        business.phone,
        website:      business.website,
        lineId:       business.lineId,
        isVerified:   business.isVerified,
      },
      places:       placesWithStats,
      stats: {
        totalPlaces:  placesWithStats.length,
        totalReviews,
        overallAvg,
      },
    });
  } catch (error) {
    console.error("GET /api/business/me:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

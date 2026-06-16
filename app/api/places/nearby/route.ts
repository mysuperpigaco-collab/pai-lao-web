import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversine } from "@/lib/geo";

// ขอบเขตประเทศไทย (เผื่อขอบเล็กน้อย) — ใช้กรองพิกัดที่หลุดออกนอกไทย
export const TH_BOUNDS = { minLat: 5.5, maxLat: 20.6, minLng: 97.3, maxLng: 105.7 };

const ALLOWED_RADIUS = [500, 1000, 3000, 5000];

// GET /api/places/nearby?lat=&lng=&radius=&category=  — public, no auth
// คืนสถานที่ APPROVED ในรัศมีที่กำหนด เรียงตามระยะทางใกล้→ไกล
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    let radius = Number(searchParams.get("radius") ?? 1000);
    const category = searchParams.get("category") || undefined;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ places: [], total: 0, error: "พิกัดไม่ถูกต้อง" }, { status: 400 });
    }
    // จำกัดค่ารัศมีให้อยู่ในชุดที่อนุญาต (กันยิงค่ามั่ว)
    if (!ALLOWED_RADIUS.includes(radius)) radius = 1000;

    // จุดต้องอยู่ในประเทศไทย
    if (lat < TH_BOUNDS.minLat || lat > TH_BOUNDS.maxLat || lng < TH_BOUNDS.minLng || lng > TH_BOUNDS.maxLng) {
      return NextResponse.json({ places: [], total: 0, outOfBounds: true });
    }

    // กรอบสี่เหลี่ยม (bounding box) รอบจุด — prefilter ก่อนคำนวณระยะจริง
    // 1° lat ≈ 111 km ; 1° lng ≈ 111 km · cos(lat)
    const dLat = radius / 111_000;
    const dLng = radius / (111_000 * Math.cos((lat * Math.PI) / 180));

    const candidates = await prisma.place.findMany({
      where: {
        approvalStatus: "APPROVED",
        lat: { gte: lat - dLat, lte: lat + dLat },
        lng: { gte: lng - dLng, lte: lng + dLng },
        ...(category ? { category } : {}),
      },
      select: {
        id: true, slug: true, title: true, titleEn: true, category: true,
        province: true, district: true, coverUrl: true, lat: true, lng: true,
        isVerified: true,
        business: { select: { businessName: true, isVerified: true } },
        _count: { select: { reviews: true, bookmarks: true } },
        reviews: { select: { rating: true } },
      },
      take: 1000,
    });

    const places = candidates
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => {
        const distanceM = Math.round(haversine(lat, lng, p.lat!, p.lng!));
        const ratings = (p.reviews ?? []).map((r) => r.rating);
        const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
        const { reviews: _reviews, ...rest } = p;
        return { ...rest, distanceM, avgRating };
      })
      .filter((p) => p.distanceM <= radius)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 300);

    return NextResponse.json({ places, total: places.length, radius });
  } catch (error) {
    console.error("GET /api/places/nearby:", error);
    return NextResponse.json({ places: [], total: 0, error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

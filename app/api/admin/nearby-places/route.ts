import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";

// GET /api/admin/nearby-places?placeId=xxx
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN"))
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    if (!placeId) return NextResponse.json({ message: "ต้องระบุ placeId" }, { status: 400 });

    const target = await prisma.place.findUnique({
      where: { id: placeId },
      select: { id: true, title: true, lat: true, lng: true, province: true, district: true },
    });
    if (!target) return NextResponse.json({ nearby: [] });
    if (!target.lat || !target.lng) return NextResponse.json({ nearby: [], noCoords: true });

    const candidates = await prisma.place.findMany({
      where: {
        id: { not: placeId },
        approvalStatus: "APPROVED",
        lat: { gte: target.lat - DUP_BBOX, lte: target.lat + DUP_BBOX },
        lng: { gte: target.lng - DUP_BBOX, lte: target.lng + DUP_BBOX },
      },
      select: {
        id: true, slug: true, title: true, titleEn: true,
        coverUrl: true, province: true, district: true, category: true,
        lat: true, lng: true, googleMapsUrl: true,
        _count: { select: { reviews: true, bookmarks: true } },
      },
    });

    const nearby = candidates
      .map(p => {
        const dist = haversine(target.lat!, target.lng!, p.lat!, p.lng!);
        const sim  = nameSimilarity(target.title, p.title);
        return { ...p, distanceM: Math.round(dist), similarity: Math.round(sim * 100) };
      })
      .filter(p => p.distanceM <= DUP_RADIUS_M && p.similarity >= DUP_SIM_THRESHOLD * 100)
      .sort((a, b) => a.distanceM - b.distanceM);

    return NextResponse.json({ nearby, targetTitle: target.title });
  } catch (err) {
    console.error("GET /api/admin/nearby-places:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

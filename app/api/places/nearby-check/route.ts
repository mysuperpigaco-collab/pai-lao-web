import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";

// POST /api/places/nearby-check — public, no auth needed
// Body: { lat, lng, name, excludeId? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, name, excludeId } = body;
    if (!lat || !lng || !name?.trim()) return NextResponse.json({ nearby: [] });

    const latN = Number(lat), lngN = Number(lng);
    if (Number.isNaN(latN) || Number.isNaN(lngN)) return NextResponse.json({ nearby: [] });

    const candidates = await prisma.place.findMany({
      where: {
        approvalStatus: "APPROVED",
        ...(excludeId ? { id: { not: excludeId } } : {}),
        lat: { gte: latN - DUP_BBOX, lte: latN + DUP_BBOX },
        lng: { gte: lngN - DUP_BBOX, lte: lngN + DUP_BBOX },
      },
      select: { id: true, slug: true, title: true, lat: true, lng: true },
    });

    const nearby = candidates
      .map(p => {
        const dist = haversine(latN, lngN, p.lat!, p.lng!);
        const sim  = nameSimilarity(name, p.title);
        return {
          id:         p.id,
          slug:       p.slug,
          title:      p.title,
          distanceM:  Math.round(dist),
          similarity: Math.round(sim * 100),
        };
      })
      .filter(p => p.distanceM <= DUP_RADIUS_M && p.similarity >= DUP_SIM_THRESHOLD * 100)
      .sort((a, b) => a.distanceM - b.distanceM);

    return NextResponse.json({ nearby });
  } catch (err) {
    console.error("POST /api/places/nearby-check:", err);
    return NextResponse.json({ nearby: [] });
  }
}

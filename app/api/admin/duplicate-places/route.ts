import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { haversine, nameSimilarity, DUP_RADIUS_M, DUP_SIM_THRESHOLD, DUP_BBOX } from "@/lib/geo";

// GET /api/admin/duplicate-places
// Returns pairs of APPROVED places within 50m with name similarity >= 60%
export async function GET(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN"))
      return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });

    const places = await prisma.place.findMany({
      where: { approvalStatus: "APPROVED", lat: { not: null }, lng: { not: null } },
      select: {
        id: true, slug: true, title: true, titleEn: true,
        coverUrl: true, province: true, district: true, category: true,
        lat: true, lng: true, googleMapsUrl: true, createdAt: true,
        _count: { select: { reviews: true, bookmarks: true } },
      },
      orderBy: { lat: "asc" },
    });

    const δ = DUP_BBOX;
    const pairs: Array<{
      a: typeof places[0] & { distanceM: number; similarity: number };
      b: typeof places[0] & { distanceM: number; similarity: number };
      distanceM: number;
      similarity: number;
    }> = [];
    const seen = new Set<string>();

    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      for (let j = i + 1; j < places.length; j++) {
        const q = places[j];
        if (q.lat! - p.lat! > δ) break; // sorted by lat, no more in bounding box
        if (Math.abs(q.lng! - p.lng!) > δ) continue;

        const dist = haversine(p.lat!, p.lng!, q.lat!, q.lng!);
        if (dist > DUP_RADIUS_M) continue;

        const sim = nameSimilarity(p.title, q.title);
        if (sim < DUP_SIM_THRESHOLD) continue;

        const key = [p.id, q.id].sort().join(":");
        if (seen.has(key)) continue;
        seen.add(key);

        const distM = Math.round(dist);
        const simPct = Math.round(sim * 100);
        pairs.push({
          a: { ...p, distanceM: distM, similarity: simPct },
          b: { ...q, distanceM: distM, similarity: simPct },
          distanceM: distM,
          similarity: simPct,
        });
      }
    }

    pairs.sort((x, y) => x.distanceM - y.distanceM);

    return NextResponse.json({ pairs, total: pairs.length });
  } catch (err) {
    console.error("GET /api/admin/duplicate-places:", err);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

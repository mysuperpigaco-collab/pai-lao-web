import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RADIUS_M = 50;
const SIM_THRESHOLD = 0.6;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i || j)
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");
  const ca = clean(a), cb = clean(b);
  if (ca === cb) return 1;
  if (ca.includes(cb) || cb.includes(ca)) return 0.92;
  const dist = levenshtein(ca, cb);
  return 1 - dist / Math.max(ca.length, cb.length);
}

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

    const δ = 0.0005; // ±55m bounding box
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
        if (dist > RADIUS_M) continue;

        const sim = nameSimilarity(p.title, q.title);
        if (sim < SIM_THRESHOLD) continue;

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
